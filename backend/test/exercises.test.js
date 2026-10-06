import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/database.js';
import { MemoryRepository } from '../test-support/memory-repository.js';

class Exercises {
  records = new Map();
  async get(id) { return structuredClone(this.records.get(id) ?? null); }
  async list(workoutId) { return structuredClone([...this.records.values()].filter(e => e.workoutId === workoutId && e.deletedAt === undefined).sort((a, b) => a.position - b.position || a.createdAt - b.createdAt || a.id.localeCompare(b.id))); }
  async create(value) { if (!this.records.has(value.id)) this.records.set(value.id, structuredClone(value)); return this.get(value.id); }
  async update(id, revision, values) {
    const old = this.records.get(id);
    if (!old || old.revision !== revision || old.deletedAt !== undefined) return null;
    this.records.set(id, { ...old, ...structuredClone(values), revision: revision + 1 }); return this.get(id);
  }
  async delete(id, revision, now) { return !!await this.update(id, revision, { deletedAt: now, updatedAt: now }); }
}
const adminToken = 'fedcba9876543210'.repeat(4);
const userToken = '0123456789abcdef'.repeat(4);
const config = { nodeEnv: 'development', devAuthEnabled: true, devAuthToken: userToken, adminDevAuthEnabled: true, adminDevToken: adminToken };
const input = { workoutId: 'beginner-full-body', name: 'Test exercise', target: '12 reps', subtitle: 'Test description', cue: 'Test cue', steps: ['First instruction.', 'Second instruction.'], video: 'https://example.invalid/demo.mp4', position: 1 };
async function serve(t, options = {}) {
  const exercises = new Exercises(); const sessions = new MemoryRepository();
  const app = createApp({ database: { ping: async () => true }, repository: sessions, exerciseRepository: exercises, config, corsOrigins: [], ...options });
  const server = createServer(app); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  async function request(path, method = 'GET', body, token = adminToken) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/member3${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  const create = (values = {}) => request('/admin/exercises', 'POST', { ...input, requestId: randomUUID(), ...values });
  return { request, create, exercises, sessions };
}
test('admin guard blocks users and anonymous CRUD, disabled mode and production', async t => {
  const { request } = await serve(t);
  for (const [method, path, body] of [
    ['GET', '/admin/access'], ['GET', '/admin/exercises?workoutId=beginner-full-body'],
    ['POST', '/admin/exercises', input], ['GET', '/admin/exercises/' + 'a'.repeat(64)],
    ['PATCH', '/admin/exercises/' + 'a'.repeat(64), { name: 'Bad' }], ['DELETE', '/admin/exercises/' + 'a'.repeat(64), { revision: 0 }],
  ]) for (const token of ['', userToken, 'wrong']) assert.equal((await request(path, method, body, token)).status, 403);
  assert.equal((await request('/admin/access')).status, 200);
  assert.equal((await request('/workout-sessions', 'GET', undefined, adminToken)).status, 401);
  for (const overrides of [{ nodeEnv: 'production' }, { adminDevAuthEnabled: false }, { adminDevToken: userToken }]) {
    const other = await serve(t, { config: { ...config, ...overrides } });
    assert.equal((await other.request('/admin/access')).status, 401);
  }
});
test('mobile login grants exercise access and logout revokes the issued session', async t => {
  const { request } = await serve(t);
  const login = await request('/admin/login', 'POST', { username: 'admin', password: adminToken }, '');
  assert.equal(login.status, 200);
  const token = login.body.token;
  assert.notEqual(token, adminToken);
  assert.equal((await request('/admin/access', 'GET', undefined, token)).status, 200);
  const created = await request('/admin/exercises', 'POST', { ...input, requestId: randomUUID() }, token);
  assert.equal(created.status, 201);
  assert.equal((await request('/admin/exercises?workoutId=beginner-full-body', 'GET', undefined, token)).body.exercises.length, 1);
  assert.equal((await request('/workout-sessions', 'GET', undefined, token)).status, 401);
  assert.equal((await request('/admin/logout', 'POST', undefined, token)).status, 204);
  assert.equal((await request('/admin/access', 'GET', undefined, token)).status, 403);
  assert.equal((await request(`/admin/exercises/${created.body.exercise.id}`, 'DELETE', { revision: 0 }, token)).status, 403);
});

test('exercise CRUD publishes ordered instructions and videos, scopes workouts and hides internal fields', async t => {
  const { create, request } = await serve(t);
  const later = (await create({ position: 2, name: 'Second' })).body.exercise;
  const first = (await create({ name: 'First' })).body.exercise;
  await create({ workoutId: 'core-stability', name: 'Other workout' });
  assert.equal(first.revision, 0);
  assert.equal('createdBy' in first, false); assert.equal('createFingerprint' in first, false);
  const list = await request('/admin/exercises?workoutId=beginner-full-body');
  assert.deepEqual(list.body.exercises.map(e => e.name), ['First', 'Second']);
  const publicList = await request('/workouts/beginner-full-body/exercises', 'GET', undefined, '');
  assert.deepEqual(publicList.body.workout.exercises, list.body.exercises);
  const detail = (await request('/workouts/beginner-full-body', 'GET', undefined, '')).body.workout;
  assert.equal(detail.guidanceManaged, true); assert.equal(detail.sessionReady, false);
  assert.deepEqual(detail.exercises, list.body.exercises);
  const updated = await request(`/admin/exercises/${first.id}`, 'PATCH', { revision: 0, name: 'Edited', steps: ['New instruction.'], video: null, position: 3 });
  assert.equal(updated.status, 200); assert.equal(updated.body.exercise.revision, 1);
  assert.equal(updated.body.exercise.video, null);
  assert.deepEqual(updated.body.exercise.steps, ['New instruction.']);
  assert.equal((await request(`/admin/exercises/${first.id}`)).body.exercise.name, 'Edited');
  assert.deepEqual((await request('/workouts/beginner-full-body/exercises')).body.workout.exercises.map(e => e.id), [later.id, first.id]);
  assert.equal((await request(`/admin/exercises/${first.id}`, 'DELETE', { revision: 1 })).status, 204);
  assert.equal((await request(`/admin/exercises/${first.id}`, 'DELETE', { revision: 1 })).status, 204);
  assert.equal((await request(`/admin/exercises/${first.id}`)).status, 404);
  assert.equal((await request('/workouts/beginner-full-body/exercises')).body.workout.exercises.length, 1);
  assert.equal((await request('/workouts/core-stability/exercises')).body.workout.exercises.length, 1);
});
test('retry-safe create, stale edit/delete and deleted-create replay cannot duplicate or resurrect', async t => {
  const { create, request, exercises } = await serve(t);
  const requestId = randomUUID();
  const replies = await Promise.all(Array.from({ length: 5 }, () => create({ requestId })));
  assert.ok(replies.every(reply => [200, 201].includes(reply.status)));
  assert.equal(exercises.records.size, 1);
  const record = replies[0].body.exercise;
  assert.equal((await create({ requestId, name: 'Different' })).status, 409);
  const updates = await Promise.all(['A', 'B'].map(name => request(`/admin/exercises/${record.id}`, 'PATCH', { revision: 0, name })));
  assert.deepEqual(updates.map(reply => reply.status).sort(), [200, 409]);
  assert.equal((await request(`/admin/exercises/${record.id}`, 'DELETE', { revision: 0 })).status, 409);
  assert.equal((await request(`/admin/exercises/${record.id}`, 'DELETE', { revision: 1 })).status, 204);
  assert.equal((await create({ requestId })).status, 409);
  assert.equal((await request('/workouts/beginner-full-body/exercises')).body.workout.exercises.length, 0);
});
test('exercise validation rejects unsafe videos, malformed plans and protected fields', async t => {
  const { create, request } = await serve(t);
  for (const bad of [
    { name: '' }, { name: 'x'.repeat(101) }, { target: '' }, { steps: [] }, { steps: [''] }, { steps: [123] },
    { steps: ['x'.repeat(501)] }, { steps: Array(21).fill('step') }, { position: 0 }, { position: 1.5 },
    { position: 10000 }, { video: 'javascript:alert(1)' }, { video: 'http://example.invalid/demo.mp4' },
    { video: 'https://user:pass@example.invalid/demo.mp4' }, { video: 'https://youtube.com/watch?v=demo' },
    { createdBy: 'forged-admin' }, { revision: 0 }, { deletedAt: 1 }, { workoutId: 'sample-full-body' },
  ]) assert.equal((await create(bad)).status, 400, JSON.stringify(bad));
  assert.equal((await create({ workoutId: 'unknown' })).status, 404);
  assert.equal((await request('/admin/exercises')).status, 400);
  assert.equal((await request('/admin/exercises/bad')).status, 400);
  assert.equal((await request('/admin/exercises/' + 'a'.repeat(64))).status, 404);
  const record = (await create({ video: 'https://example.invalid/demo.m3u8?version=2' })).body.exercise;
  for (const invalid of [{ revision: 0 }, { revision: -1, name: 'Name' }, { revision: 0, workoutId: 'core-stability' }, { revision: 0, id: 'forged' }, { revision: 0, steps: null }]) {
    assert.equal((await request(`/admin/exercises/${record.id}`, 'PATCH', invalid)).status, 400);
  }
  assert.equal((await request('/admin/exercises', 'POST', { ...input, name: 'x'.repeat(20000) })).status, 413);
});
test('exercise mutations preserve saved session snapshots and failures stay sanitized', async t => {
  const { create, request, exercises } = await serve(t);
  const session = (await request('/workout-sessions', 'POST', { workoutId: 'sample-gentle-start', requestId: randomUUID() }, userToken)).body.session;
  const record = (await create()).body.exercise;
  await request(`/admin/exercises/${record.id}`, 'PATCH', { revision: 0, name: 'Updated guidance' });
  await request(`/admin/exercises/${record.id}`, 'DELETE', { revision: 1 });
  assert.deepEqual((await request(`/workout-sessions/${session.id}`, 'GET', undefined, userToken)).body.session.snapshot, session.snapshot);
  exercises.list = async () => { throw new Error('private database information'); };
  const failure = await request('/workouts/beginner-full-body/exercises');
  assert.equal(failure.status, 503); assert.ok(!JSON.stringify(failure.body).includes('private database'));
  const missing = await serve(t, { exerciseRepository: undefined });
  assert.equal((await missing.request('/workouts/beginner-full-body/exercises')).status, 503);
  assert.equal((await missing.request('/workouts/sample-gentle-start/exercises')).status, 200);
});
test('exercise repository registers on the connected instance and uses revision-guarded tombstones', async () => {
  const odm = new mongoose.Mongoose();
  const repo = createDatabase({ odm }).createExerciseRepository();
  const model = odm.models.Exercise;
  assert.equal(model.db, odm.connection); assert.equal(model.collection.name, 'exercises');
  assert.equal(mongoose.models.Exercise, undefined); assert.equal(model.schema.options.autoCreate, false);
  const seen = [];
  model.collection.createIndex = async keys => seen.push(['index', keys]);
  model.findOneAndUpdate = (filter, changes) => ({ lean: async () => { seen.push(['update', filter, changes]); return null; } });
  model.updateOne = async (filter, changes) => { seen.push(['delete', filter, changes]); return { modifiedCount: 1 }; };
  await repo.initialize(); await repo.update('exercise', 3, { name: 'Edited' }); await repo.delete('exercise', 4, 123);
  assert.deepEqual(seen[0][1], { workoutId: 1, deletedAt: 1, position: 1, createdAt: 1 });
  assert.deepEqual(seen[1][1], { _id: 'exercise', revision: 3, deletedAt: { $exists: false } });
  assert.deepEqual(seen[2][1], { _id: 'exercise', revision: 4, deletedAt: { $exists: false } });
  assert.deepEqual(seen[2][2], { $set: { deletedAt: 123, updatedAt: 123 }, $inc: { revision: 1 } });
  assert.deepEqual(odm.modelNames(), ['Exercise']);
});

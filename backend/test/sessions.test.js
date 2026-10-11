import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { DEVELOPMENT_OWNER } from '../src/identity.js';
import { workouts } from '../src/catalog.js';
import { member2Workouts } from '../../shared/discovery/workouts.ts';
import { exerciseDuration } from '../../shared/exercise-duration.ts';

// An isolated injected repository. No environment file or MongoDB connection is used.
import { MemoryRepository } from '../test-support/memory-repository.js';
const testToken = '0123456789abcdef'.repeat(4);
const config = { devAuthEnabled: true, nodeEnv: 'development', devAuthToken: testToken };
async function serve(t, options = {}) {
  const repository = new MemoryRepository();
  const app = createApp({ database: { ping: async () => true }, corsOrigins: ['http://localhost:8081'], config, repository, ...options });
  const server = createServer(app); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/member3`;
  async function request(path, method = 'GET', body, token = testToken) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) });
    return { status: response.status, headers: response.headers, body: response.status === 204 ? null : await response.json() };
  }
  const create = (workoutId = workouts[0].id, extra = {}) => request('/workout-sessions', 'POST', { workoutId, requestId: randomUUID(), ...extra });
  const patch = (s, action, extra = {}) => request(`/workout-sessions/${s.id}`, 'PATCH', { revision: s.revision, operationId: randomUUID(), action, ...extra });
  return { request, repository, create, patch, base };
}

test('catalog has stable distinct lengths/durations and rejects unknown IDs', async t => {
  const { request } = await serve(t);
  const result = await request('/workouts', 'GET', undefined, '');
  assert.equal(result.status, 200);
  assert.equal(result.body.workouts.length, 3);
  assert.equal(new Set(result.body.workouts.map(w => w.exercises.length)).size, 3);
  assert.equal(new Set(result.body.workouts.map(w => w.durationSeconds)).size, 3);
  assert.ok(result.body.workouts.every(w => w.sample && w.name.startsWith('Sample:')));
  assert.equal((await request('/workouts/not-real')).status, 404);
  assert.deepEqual((await request(`/workouts/${workouts[0].id}`)).body.workout, workouts[0]);
});

test('leader selection resolves exact IDs and ordered targets without inventing a session plan', async t => {
  const { request, create, repository } = await serve(t);
  const list = await request('/workouts?source=leader', 'GET', undefined, '');
  assert.equal(list.status, 200);
  assert.equal(list.body.workouts.length, member2Workouts.length);
  assert.equal(new Set(list.body.workouts.map(workout => workout.id)).size, member2Workouts.length);
  for (const selected of member2Workouts) {
    const detail = await request(`/workouts/${selected.id}`, 'GET', undefined, '');
    assert.equal(detail.status, 200);
    const workout = detail.body.workout;
    assert.equal(workout.id, selected.id);
    assert.equal(workout.name, selected.title);
    assert.equal(workout.durationSeconds, selected.duration * 60);
    assert.equal(workout.sessionReady, false);
    assert.equal(workout.sample, false);
    assert.equal('rounds' in workout, false);
    assert.deepEqual(workout.exercises.map(exercise => ({ title: exercise.name, target: exercise.target })), selected.exercises);
    assert.equal((await create(selected.id)).status, 409);
  }
  assert.equal(repository.records.size, 0);
  assert.equal((await request('/workouts/beginner-full-body')).body.workout.exercises.length, 8);
  assert.equal((await request('/workouts/sample-full-body')).body.workout.exercises.length, 5);
});

test('all session endpoints require the development token; production adapter refuses it', async t => {
  const { request } = await serve(t);
  for (const [method, suffix] of [['GET', ''], ['POST', ''], ['GET', '/' + 'a'.repeat(64)], ['PATCH', '/' + 'a'.repeat(64)], ['DELETE', '/' + 'a'.repeat(64)]]) {
    for (const token of ['', 'wrong']) assert.equal((await request('/workout-sessions' + suffix, method, method === 'GET' ? undefined : {}, token)).status, 401);
  }
  const prod = await serve(t, { config: { ...config, nodeEnv: 'production' } });
  assert.equal((await prod.request('/workout-sessions')).status, 401);
  const disabled = await serve(t, { config: { ...config, devAuthEnabled: false } });
  assert.equal((await disabled.request('/workout-sessions')).status, 401);
});

test('retry-safe creation, immutable snapshot and mismatched retry rejection', async t => {
  const { create, request, repository } = await serve(t);
  const requestId = randomUUID();
  const replies = await Promise.all(Array.from({ length: 6 }, () => create(workouts[0].id, { requestId })));
  assert.equal(new Set(replies.map(r => r.body.session.id)).size, 1);
  assert.equal(repository.records.size, 1);
  const s = replies[0].body.session;
  assert.equal(s.ownerId, DEVELOPMENT_OWNER); assert.equal(s.revision, 0);
  assert.equal(s.snapshot.exercises.length, 2);
  assert.equal(s.snapshot.durationSeconds, 60);
  assert.equal('createFingerprint' in s, false);
  assert.equal((await create(workouts[1].id, { requestId })).status, 409);
  assert.equal((await request(`/workout-sessions/${s.id}`)).body.session.snapshot.name, workouts[0].name);
});

test('owner isolation covers list, read, patch, delete and retry-key namespaces', async t => {
  const identity = (req, res, next) => { if (!['Bearer alice', 'Bearer bob'].includes(req.get('Authorization'))) return res.sendStatus(401); req.ownerId = req.get('Authorization').slice(7); next(); };
  const { request } = await serve(t, { identity });
  const body = { workoutId: workouts[0].id, requestId: randomUUID() };
  const alice = (await request('/workout-sessions', 'POST', body, 'alice')).body.session;
  const bob = (await request('/workout-sessions', 'POST', body, 'bob')).body.session;
  assert.notEqual(alice.id, bob.id);
  assert.deepEqual((await request('/workout-sessions', 'GET', undefined, 'bob')).body.sessions.map(s => s.id), [bob.id]);
  const path = `/workout-sessions/${alice.id}`;
  assert.equal((await request(path, 'GET', undefined, 'bob')).status, 404);
  assert.equal((await request(path, 'PATCH', { revision: 0, operationId: randomUUID(), action: 'end' }, 'bob')).status, 404);
  assert.equal((await request(path, 'DELETE', { revision: 0 }, 'bob')).status, 404);
  assert.equal((await request(path, 'GET', undefined, 'alice')).body.session.revision, 0);
});

test('payload allowlists, invalid IDs, ranges, malformed and oversized JSON', async t => {
  const { request, create, patch, base } = await serve(t);
  for (const extra of [{ ownerId: 'another-user' }, { status: 'completed' }, { workSeconds: '10' }, { workSeconds: 9 }, { restSeconds: 121 }, { requestId: '$bad' }, { workSeconds: null }, { rounds: 0 }, { rounds: 6 }, { rounds: 1.5 }, { rounds: '2' }, { rounds: null }]) {
    // Explicit null is not a valid override.
    assert.equal((await create(workouts[0].id, extra)).status, 400);
  }
  assert.equal((await create('unknown')).status, 404);
  assert.equal((await request('/workout-sessions/invalid')).status, 400);
  assert.equal((await request('/workout-sessions/' + 'a'.repeat(64))).status, 404);
  assert.equal((await request('/workout-sessions', 'POST', '{bad')).status, 400);
  assert.equal((await request('/workout-sessions', 'POST', { pad: 'x'.repeat(17000) })).status, 413);
  const s = (await create()).body.session;
  for (const extra of [{ deltaMs: -1 }, { deltaMs: 60001 }, { deltaMs: 0.5 }, { phase: 100 }, { ownerId: 'bob' }, { remainingMs: 0 }, { revision: '0' }, { action: 'made-up' }]) assert.equal((await patch(s, 'checkpoint', extra)).status, 400);
  const preflight = await fetch(base + '/workout-sessions', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081', 'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  assert.equal(preflight.status, 204);
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']) assert.ok(preflight.headers.get('access-control-allow-methods').includes(method));
});

test('transitions, retry after lost response, stale revisions, and saved summary CRUD', async t => {
  const { create, request, patch } = await serve(t);
  let s = (await create()).body.session;
  const path = `/workout-sessions/${s.id}`;
  assert.equal((await request(path, 'DELETE', { revision: s.revision })).status, 409);
  assert.equal((await patch(s, 'resume')).status, 409);
  const command = { revision: 0, operationId: randomUUID(), action: 'pause', deltaMs: 21000 };
  s = (await request(path, 'PATCH', command)).body.session;
  assert.equal(s.status, 'paused'); assert.equal(s.completedSets, 1); assert.equal(s.phase, 1); assert.equal(s.remainingMs, 9000); assert.equal(s.elapsedMs, 21000);
  const replay = (await request(path, 'PATCH', command)).body.session;
  assert.equal(replay.revision, s.revision); assert.equal(replay.elapsedMs, s.elapsedMs);
  assert.equal((await request(path, 'PATCH', { ...command, deltaMs: 22000 })).status, 409);
  assert.equal((await patch(s, 'pause', { deltaMs: 1 })).status, 400);
  assert.equal((await patch(s, 'skip')).status, 409);
  assert.equal((await patch(s, 'note', { note: 'too early' })).status, 409);
  s = (await patch(s, 'resume')).body.session;
  s = (await patch(s, 'skip')).body.session;
  assert.equal(s.phase, 2); assert.equal(s.skippedSets, 0);
  const stale = s;
  s = (await patch(s, 'end', { deltaMs: 3000 })).body.session;
  assert.equal(s.status, 'ended-early'); assert.ok(s.finishedAt); assert.equal(s.elapsedMs, 24000);
  assert.equal((await patch(stale, 'checkpoint')).status, 409);
  assert.equal((await patch(s, 'resume')).status, 409);
  assert.equal((await patch(s, 'note', { note: 'x'.repeat(501) })).status, 400);
  s = (await patch(s, 'note', { note: '  Felt good  ' })).body.session;
  assert.equal(s.note, 'Felt good');
  assert.equal((await request(path, 'GET')).body.session.note, 'Felt good');
  assert.equal((await request(path, 'DELETE', { revision: stale.revision })).status, 409);
  assert.equal((await request(path, 'DELETE', { revision: s.revision })).status, 204);
  assert.equal((await request(path)).status, 404);
  assert.equal((await request(`/workouts/${s.workoutId}`)).status, 200);
});

test('all fixture lengths complete from their snapshots; skip totals are derived', async t => {
  const { create, patch } = await serve(t);
  for (const workout of workouts) {
    let s = (await create(workout.id)).body.session;
    const total = workout.exercises.length * workout.rounds;
    while (s.status === 'running') s = (await patch(s, 'checkpoint', { deltaMs: Math.min(60000, s.snapshot.durationSeconds * 1000 - s.elapsedMs) })).body.session;
    assert.equal(s.status, 'completed'); assert.equal(s.completedSets, total); assert.equal(s.skippedSets, 0); assert.equal(s.phase, total * 2); assert.equal(s.remainingMs, 0); assert.equal(s.elapsedMs, workout.durationSeconds * 1000);
    assert.equal(s.completedIntervals.length, total * 2); assert.equal(s.skippedIntervals.length, 0);
    assert.equal((await patch(s, 'end')).status, 409);
    let skipped = (await create(workout.id)).body.session;
    for (let i = 0; i < total; i++) skipped = (await patch(skipped, 'skip')).body.session;
    assert.equal(skipped.status, 'completed'); assert.equal(skipped.completedSets, 0); assert.equal(skipped.skippedSets, total); assert.equal(skipped.elapsedMs, 0);
    assert.equal(skipped.skippedIntervals.length, total * 2); assert.equal(new Set(skipped.skippedIntervals).size, total * 2);
  }
});

test('concurrent updates admit only one revision winner; driver failures are sanitized', async t => {
  const { create, patch, repository } = await serve(t);
  const s = (await create()).body.session;
  const replies = await Promise.all([patch(s, 'pause'), patch(s, 'end')]);
  assert.deepEqual(replies.map(r => r.status).sort(), [200, 409]);
  repository.get = async () => { throw new Error('mongodb://private-secret@host/test'); };
  const failed = await create();
  assert.equal(failed.status, 503); assert.ok(!JSON.stringify(failed).includes('private-secret'));
});

test('concurrent replay of the same command applies progress exactly once', async t => {
  const { create, request } = await serve(t);
  const s = (await create()).body.session;
  const command = { revision: 0, operationId: randomUUID(), action: 'skip', deltaMs: 1000 };
  const replies = await Promise.all(Array.from({ length: 5 }, () => request(`/workout-sessions/${s.id}`, 'PATCH', command)));
  assert.ok(replies.every(r => r.status === 200));
  assert.ok(replies.every(r => r.body.session.revision === 1 && r.body.session.skippedSets === 1 && r.body.session.elapsedMs === 1000));
});

test('only explicit bounded durations become timers; repetitions and per-side targets remain manual', () => {
  for (const [target, seconds] of [['3min', 180], [' 30 seconds ', 30], ['1.5 minutes', 90], ['60s', 60], ['1 SEC', 1], ['60min', 3600]]) {
    assert.equal(exerciseDuration(target), seconds);
  }
  for (const target of ['12 reps', '3 x 10', '30s each side', '10-15 reps', '01:30', '0 sec', '-1s', '100min', '0.1sec', 'Infinity s', '']) {
    assert.equal(exerciseDuration(target), null);
  }
});

function managedFixture() {
  const id = '507f1f77bcf86cd799439011';
  const record = { _id: id, title: 'Managed workout', category: 'Strength', difficulty: 'Beginner', duration: 15, description: 'Managed plan', exercises: [] };
  const exercises = [
    { id: 'timed', name: 'Timed exercise', target: '2 seconds', subtitle: 'Description', steps: ['Follow this step.'], position: 1, createdBy: 'private-admin' },
    { id: 'manual', name: 'Rep exercise', target: '12 reps', steps: ['Move with control.'], position: 2 },
  ];
  return { id, record, exercises, workoutRepository: { get: async key => key.toLowerCase() === id ? record : null }, exerciseRepository: { list: async () => structuredClone(exercises) } };
}

test('managed workout supports timed/manual targets, rest, multiple rounds, pause and exact-once completion', async t => {
  const fixture = managedFixture();
  const { request, create, patch } = await serve(t, fixture);
  const preview = await request(`/workouts/${fixture.id}/session-plan`, 'GET', undefined, '');
  assert.equal(preview.status, 200);
  assert.deepEqual(preview.body.workout.exercises.map(e => e.durationSeconds), [2, null]);
  assert.equal('createdBy' in preview.body.workout.exercises[0], false);
  let s = (await create(fixture.id, { rounds: 2, restSeconds: 5 })).body.session;
  assert.equal(s.snapshot.rounds, 2); assert.equal(s.remainingMs, 2000);
  assert.equal((await patch(s, 'complete')).status, 409);
  s = (await patch(s, 'checkpoint', { deltaMs: 2000 })).body.session;
  assert.equal(s.phase, 1); assert.equal(s.completedSets, 1);
  s = (await patch(s, 'skip')).body.session;
  assert.equal(s.phase, 2); assert.equal(s.skippedSets, 0);
  s = (await patch(s, 'checkpoint', { deltaMs: 15000 })).body.session;
  assert.equal(s.phase, 2); assert.equal(s.remainingMs, 0); assert.equal(s.elapsedMs, 17000);
  const command = { revision: s.revision, operationId: randomUUID(), action: 'complete', deltaMs: 1000 };
  s = (await request(`/workout-sessions/${s.id}`, 'PATCH', command)).body.session;
  assert.equal(s.phase, 3); assert.equal(s.completedSets, 2);
  const replay = (await request(`/workout-sessions/${s.id}`, 'PATCH', command)).body.session;
  assert.deepEqual(replay, s);
  s = (await patch(s, 'pause', { deltaMs: 1000 })).body.session;
  assert.equal(s.remainingMs, 4000);
  assert.equal((await patch(s, 'complete')).status, 409);
  s = (await patch(s, 'resume')).body.session;
  s = (await patch(s, 'checkpoint', { deltaMs: 4000 })).body.session;
  assert.equal(s.phase, 4); assert.equal(s.remainingMs, 2000);
  s = (await patch(s, 'checkpoint', { deltaMs: 7000 })).body.session;
  assert.equal(s.phase, 6); assert.equal(s.remainingMs, 0);
  s = (await patch(s, 'complete', { deltaMs: 3000 })).body.session;
  assert.equal(s.status, 'completed'); assert.equal(s.phase, 8);
  assert.equal(s.completedSets, 4); assert.equal(s.skippedSets, 0); assert.equal(s.elapsedMs, 33000);
  assert.ok(s.finishedAt); assert.ok(!s.completedIntervals.includes(7));
});

test('a lost create response recovers its original plan after the parent and exercises disappear', async t => {
  const fixture = managedFixture();
  const { create, request } = await serve(t, fixture);
  const requestId = randomUUID();
  const first = await create(fixture.id, { requestId, rounds: 2, restSeconds: 10 });
  fixture.exercises[0].name = 'Changed'; fixture.exercises.splice(1);
  fixture.workoutRepository.get = async () => null;
  const recovered = await create(fixture.id, { requestId, rounds: 2, restSeconds: 10 });
  assert.equal(recovered.status, 200); assert.deepEqual(recovered.body.session, first.body.session);
  assert.equal((await create(fixture.id, { requestId, rounds: 3, restSeconds: 10 })).status, 409);
  assert.equal((await create(fixture.id)).status, 404);
  assert.equal((await request(`/workout-sessions/${first.body.session.id}`)).body.session.snapshot.exercises.length, 2);
});

test('empty or failed exercise storage cannot create a fabricated session plan', async t => {
  const fixture = managedFixture(); fixture.exercises.length = 0;
  const { create, request, repository } = await serve(t, fixture);
  assert.equal((await create(fixture.id)).status, 409);
  assert.equal((await request(`/workouts/${fixture.id}/session-plan`)).status, 409);
  fixture.exerciseRepository.list = async () => { throw new Error('private storage failure'); };
  const failure = await create(fixture.id);
  assert.equal(failure.status, 503); assert.ok(!JSON.stringify(failure).includes('private storage'));
  assert.equal(repository.records.size, 0);
});

test('a skip at the end of a rest interval cannot accidentally skip the following exercise', async t => {
  const { create, patch } = await serve(t, managedFixture());
  let s = (await create('507f1f77bcf86cd799439011', { restSeconds: 5 })).body.session;
  s = (await patch(s, 'checkpoint', { deltaMs: 2000 })).body.session;
  s = (await patch(s, 'skip', { deltaMs: 5000 })).body.session;
  assert.equal(s.phase, 2); assert.equal(s.status, 'running'); assert.equal(s.skippedSets, 0);
  s = (await patch(s, 'skip', { deltaMs: 1000 })).body.session;
  assert.equal(s.status, 'completed'); assert.equal(s.skippedSets, 1); assert.equal(s.completedSets, 1);
});

import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { createWorkoutRepository, publicWorkout } from '../src/workout-repository.js';
import { workoutFilter } from '../src/workout-routes.js';

const id = '507f1f77bcf86cd799439011';
const record = { _id: id, title: 'Leader workout', category: 'Strength', difficulty: 'Beginner', duration: 15, description: 'Saved workout', active: true, exercises: [{ title: 'Squat', target: '12 reps' }], internal: 'private' };

test('leader model reads the existing workouts collection in the selected database without writes', async t => {
  const odm = new mongoose.Mongoose();
  t.after(() => odm.disconnect());
  const repo = createWorkoutRepository(odm);
  const connection = odm.connection.useDb('fittrack_db', { useCache: true });
  const model = connection.models.Workout;
  assert.equal(model.collection.collectionName, 'workouts');
  assert.equal(model.schema.options.autoCreate, false);
  assert.equal(model.schema.options.autoIndex, false);
  let filter;
  model.find = value => {
    filter = value;
    return { sort: () => ({ lean: () => ({ exec: async () => [record] }) }) };
  };
  model.findOne = value => {
    filter = value;
    return { lean: () => ({ exec: async () => record }) };
  };
  assert.deepEqual(await repo.list({ category: 'Strength', active: false }), [record]);
  assert.deepEqual(filter, { category: 'Strength', active: true });
  assert.equal((await repo.get(id))._id, id);
  assert.deepEqual(filter, { _id: id, active: true });
  assert.equal(await repo.get('invalid'), null);
  assert.equal(repo.create, undefined);
  assert.equal(publicWorkout(record).internal, undefined);
});

test('leader filters escape regex text and reject query objects, arrays and invalid durations', () => {
  const filter = workoutFilter({ search: 'a.*[b]', category: 'Strength', difficulty: 'Beginner', duration: '15', equipment: 'Dumbbells', lowImpact: 'true' });
  assert.equal(filter.duration, 15);
  assert.equal(filter.lowImpact, true);
  assert.equal(filter.category, 'Strength');
  const regex = new RegExp(filter.$or[0].title.$regex);
  assert.ok(regex.test('a.*[b]')); assert.ok(!regex.test('ab'));
  for (const query of [{ category: { $ne: '' } }, { search: ['a', 'b'] }, { duration: 'NaN' }, { duration: '-1' }, { lowImpact: 'yes' }]) {
    assert.throws(() => workoutFilter(query), error => error.status === 400);
  }
});

test('leader API preserves its response contract, shares IDs with guidance, and never substitutes static workouts on failure', async t => {
  let captured; let unavailable = false;
  const workoutRepository = {
    async list(filter) { captured = filter; if (unavailable) throw new Error('private connection string'); return [record]; },
    async get(key) { if (unavailable) throw new Error('private connection string'); return key === id ? record : null; },
  };
  const app = createApp({ database: { ping: async () => true }, corsOrigins: [], config: {}, workoutRepository });
  const server = createServer(app).listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const get = path => fetch(`http://127.0.0.1:${server.address().port}${path}`);
  const list = await (await get('/api/member2/workouts?duration=15&search=Leader')).json();
  assert.equal(list.success, true); assert.equal(list.count, 1); assert.equal(list.data[0]._id, id);
  assert.equal(captured.duration, 15);
  const overviews = await (await get('/api/member3/workouts?source=leader')).json();
  assert.deepEqual(overviews.workouts.map(w => w.id), [id]);
  assert.equal(overviews.workouts[0].sessionReady, false);
  assert.equal((await (await get(`/api/member2/workouts/${id}`)).json()).data._id, id);
  assert.equal((await (await get(`/api/member3/workouts/${id}`)).json()).workout.id, id);
  assert.equal((await get('/api/member2/workouts/invalid')).status, 404);
  assert.equal((await get('/api/member2/workouts?duration=bad')).status, 400);
  for (const [method, suffix] of [['POST', ''], ['PUT', `/${id}`], ['DELETE', `/${id}`]]) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/member2/workouts${suffix}`, { method });
    assert.equal(response.status, 401);
  }
  unavailable = true;
  for (const path of ['/api/member2/workouts', '/api/member3/workouts?source=leader', `/api/member3/workouts/${id}`]) {
    const response = await get(path); assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes('private connection string'));
  }
});

test('admin workout CRUD is authorized, validated, and public reads stay active-only', async t => {
  const store = new Map([[id, { ...record }]]);
  const calls = [];
  const workoutRepository = {
    async list() { return [...store.values()].filter(w => w.active); },
    async get(key) { const w = store.get(key); return w?.active ? w : null; },
    admin: {
      async list() { return [...store.values()]; },
      async get(key) { return store.get(key) ?? null; },
      async create(input) { calls.push('create'); const w = { _id: '507f1f77bcf86cd799439012', ...input }; store.set(w._id, w); return w; },
      async update(key, input) { calls.push('update'); if (!store.has(key)) return null; const w = { ...store.get(key), ...input }; store.set(key, w); return w; },
      async remove(key) { calls.push('remove'); const w = store.get(key); store.delete(key); return w ?? null; },
    },
  };
  let allow = false;
  const adminIdentity = (_req, res, next) => allow ? next() : res.status(401).json({ error: 'Unauthorized' });
  const app = createApp({ database: { ping: async () => true }, corsOrigins: [], config: {}, workoutRepository, adminIdentity });
  const server = createServer(app).listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/member2/workouts`;
  const send = (path, method, body) => fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });

  assert.equal((await send('/admin/all', 'GET')).status, 401);
  assert.deepEqual(calls, []);

  allow = true;
  assert.equal((await send('', 'POST', { title: '' })).status, 400);
  assert.equal((await send('/not-an-id', 'PUT', {})).status, 400);
  assert.equal((await send('/507f1f77bcf86cd799439099', 'DELETE')).status, 404);

  const created = await send('', 'POST', { title: 'Hidden draft', category: 'Strength', difficulty: 'Beginner', duration: 20, description: 'Draft workout', equipment: 'No equipment', lowImpact: false, active: false, exercises: [{ title: 'Plank', target: '30 sec' }] });
  assert.equal(created.status, 201, await created.clone().text());
  const draft = (await created.json()).data;
  assert.equal(draft.active, false);

  const publicList = await (await send('', 'GET')).json();
  assert.ok(!publicList.data.some(w => w._id === draft._id));
  assert.equal((await send(`/${draft._id}`, 'GET')).status, 404);
  const adminList = await (await send('/admin/all', 'GET')).json();
  assert.ok(adminList.data.some(w => w._id === draft._id));

  assert.equal((await send(`/${draft._id}`, 'PUT', { active: true })).status, 200);
  assert.equal((await send(`/${draft._id}`, 'GET')).status, 200);
  assert.equal((await send(`/${draft._id}`, 'DELETE')).status, 200);
  assert.equal(store.has(draft._id), false);
});

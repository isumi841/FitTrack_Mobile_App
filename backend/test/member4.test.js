import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { createMember4, createMember4Models } from '../src/member4/index.js';
import { memoryMember4Models } from '../test-support/member4-models.js';

const alice = '111111111111111111111111', bob = '222222222222222222222222';
async function fixture(t) {
  const { models, odm } = memoryMember4Models();
  const member4 = createMember4({ models, env: {} });
  const identity = (req, res, next) => {
    const id = req.get('Authorization')?.replace('Bearer ', '');
    if (![alice, bob].includes(id)) return res.status(401).json({ error: 'Login required.' });
    req.ownerId = `user:${id}`; next();
  };
  const auth = { router: (_req, _res, next) => next(), rateLimiter: (_req, _res, next) => next(), identity };
  const app = createApp({ database: { ping: async () => true }, corsOrigins: [], config: {}, auth, member4 });
  const server = createServer(app).listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await odm.disconnect(); });
  return async (path, method = 'GET', body, owner = alice) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/member4${path}`, { method,
      headers: { 'Content-Type': 'application/json', ...(owner ? { Authorization: `Bearer ${owner}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  };
}
test('Member4 registers existing collections on the shared connection without a duplicate workout model', () => {
  const odm = new mongoose.Mongoose(); const models = createMember4Models(odm);
  assert.deepEqual(Object.values(models).map(model => model.collection.name), ['goals', 'userprofiles', 'workoutreminders']);
  assert.equal(odm.models.Workout, undefined);
  assert.equal(createMember4Models(odm).Goal, models.Goal);
});
test('Member4 profile CRUD is authenticated and owner scoped, and photo configuration is optional', async t => {
  const call = await fixture(t);
  assert.equal((await call('/profile', 'GET', undefined, '')).status, 401);
  assert.equal((await call('/profile')).status, 404);
  const value = { fullName: 'Test Member', username: 'test-member', dateOfBirth: '2000-01-01', bio: 'Keep moving' };
  assert.equal((await call('/profile', 'POST', value)).status, 201);
  assert.equal((await call('/profile', 'POST', value)).status, 409);
  assert.equal((await call('/profile', 'GET', undefined, bob)).status, 404);
  assert.equal((await call('/profile', 'PATCH', { fullName: 'Changed' })).body.data.fullName, 'Changed');
  assert.equal((await call('/profile', 'PATCH', { userId: bob })).status, 400);
  assert.equal((await call('/profile', 'PATCH', { fullName: { $ne: '' } })).status, 400);
  assert.equal((await call('/profile', 'PATCH', { dateOfBirth: 'invalid' })).status, 400);
  assert.equal((await call('/profile/avatar', 'POST', {})).status, 503);
  assert.equal((await call('/profile', 'DELETE', undefined, bob)).status, 404);
  assert.equal((await call('/profile', 'DELETE')).status, 200);
  assert.equal((await call('/profile')).status, 404);
});
test('Member4 goal and reminder CRUD rejects invalid input and cross-account mutations', async t => {
  const call = await fixture(t);
  const goal = { goalType: 'workoutsPerWeek', title: 'Train three times', target: 3, duration: 'Weekly' };
  assert.equal((await call('/goals', 'POST', { ...goal, target: -1 })).status, 400);
  assert.equal((await call('/goals', 'POST', { ...goal, target: '3' })).status, 400);
  const created = await call('/goals', 'POST', goal); assert.equal(created.status, 201);
  const id = created.body.data._id;
  assert.equal((await call('/goals', 'GET', undefined, bob)).body.count, 0);
  assert.equal((await call(`/goals/${id}`, 'PATCH', { target: 4 }, bob)).status, 404);
  assert.equal((await call(`/goals/${id}`, 'PATCH', { target: 4 })).body.data.target, 4);
  assert.equal((await call(`/goals/${id}`, 'DELETE')).status, 200);
  const reminder = { enabled: true, time: '06:30 AM', days: ['Mon'], timezone: 'Asia/Colombo' };
  assert.equal((await call('/reminders', 'POST', { ...reminder, time: '30:80 PM' })).status, 400);
  assert.equal((await call('/reminders', 'POST', { ...reminder, enabled: 'true' })).status, 400);
  const saved = await call('/reminders', 'POST', reminder); assert.equal(saved.status, 201);
  const key = saved.body.data._id;
  assert.equal((await call(`/reminders/${key}`, 'PATCH', { enabled: false }, bob)).status, 404);
  assert.equal((await call(`/reminders/${key}`, 'PATCH', { enabled: false })).body.data.enabled, false);
  assert.equal((await call(`/reminders/${key}`, 'DELETE', undefined, bob)).status, 404);
  assert.equal((await call(`/reminders/${key}`, 'DELETE')).status, 200);
  assert.equal((await call('/workouts', 'POST', {})).status, 404);
});

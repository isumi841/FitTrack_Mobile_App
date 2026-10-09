const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bcrypt = require('bcrypt');
const { createMember1Middleware } = require('../index');
const { createApp } = require('../app');
const { createAuthRouter } = require('../routes/auth');
const { createSessionService } = require('../services/session');
const { createMemoryModels } = require('./helpers/memory-models');

const env = {
  NODE_ENV: 'test', MONGODB_URI: 'mongodb://127.0.0.1:27017/merge_test',
  EMAIL_MODE: 'development', JWT_SECRET: 'isolated-merge-tests-secret-at-least-32-bytes',
};
async function listen(t, app) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('existing backend health, root and member4 endpoints survive missing member1 configuration', async (t) => {
  const { default: app } = await import('../../../app.js');
  const base = await listen(t, app);
  for (const path of ['/', '/api/health']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
  }
  const response = await fetch(base + '/api/member4/goals', { headers: { 'x-user-id': 'invalid' } });
  assert.equal(response.status, 401); // Does not issue a database query.
});

test('missing auth credentials return a safe 503 without intercepting other modules', async (t) => {
  const app = express();
  app.use(createMember1Middleware({ env: {} }));
  app.get('/api/member4/merge-health', (_req, res) => res.json({ success: true }));
  const base = await listen(t, app);
  assert.equal((await fetch(base + '/api/auth/login', { method: 'POST' })).status, 503);
  assert.equal((await fetch(base + '/api/member4/merge-health')).status, 200);
});

test('merged auth mounts once and supports signup, verification and login without real email or database writes', async (t) => {
  const models = createMemoryModels();
  const emails = [];
  let built = 0;
  const app = express();
  app.use(createMember1Middleware({ env, buildApp(config) {
    built++;
    return createApp({ config, authRouter: createAuthRouter({
      ...models, config,
      bcrypt: { hash: (value) => bcrypt.hash(value, 4), compare: bcrypt.compare },
      sendVerificationEmail: async (message) => { emails.push(message); },
    }) });
  } }));
  const base = await listen(t, app);
  const post = async (path, body) => {
    const response = await fetch(base + '/api/auth/' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json(), headers: response.headers };
  };
  const email = 'member@example.test';
  const password = 'FitTrack@123';
  assert.equal((await post('signup', { email, password, confirmPassword: password })).status, 201);
  assert.equal(emails.length, 1);
  assert.match(emails[0].otp, /^\d{4}$/);
  assert.equal((await post('verify-email', { email, otp: emails[0].otp })).status, 201);
  const login = await post('login', { email, password });
  assert.equal(login.status, 200);
  assert.equal(login.headers.get('cache-control'), 'no-store');
  const claims = await createSessionService({ jwt: { secret: env.JWT_SECRET } }).verify(login.data.session.accessToken);
  assert.equal(claims.sub, login.data.user.id);
  assert.equal(built, 1);
  assert.equal((await post('login', { email, password: 'Wrong@123' })).status, 401);
});

test('member4 accepts signed-in identity and rejects an invalid bearer token instead of falling back to dev identity', async (t) => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = env.JWT_SECRET;
  t.after(() => { if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous; });
  const { devAuth } = await import('../../../middleware/devAuth.js');
  const app = express();
  app.get('/identity', devAuth, (req, res) => res.json(req.user));
  const base = await listen(t, app);
  const id = '507f1f77bcf86cd799439022';
  const session = await createSessionService({ jwt: { secret: env.JWT_SECRET } }).issue({ _id: id, authProvider: 'local' });
  const response = await fetch(base + '/identity', { headers: { Authorization: `Bearer ${session.accessToken}` } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id });
  assert.equal((await fetch(base + '/identity', { headers: { Authorization: 'Bearer invalid', 'x-user-id': id } })).status, 401);
  assert.equal((await fetch(base + '/identity', { headers: { 'x-user-id': id } })).status, 200);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createDevelopmentAdminAuth, ADMIN_SESSION_TTL_MS } from '../src/admin-auth.js';

const password = 'fedcba9876543210'.repeat(4);
const config = { nodeEnv: 'development', adminDevAuthEnabled: true, adminDevToken: password, devAuthToken: '0123456789abcdef'.repeat(4) };
function response() {
  return { code: 200, body: undefined, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() { return this; } };
}
function login(auth, body = { username: 'admin', password }) { const res = response(); auth.login({ body }, res); return res; }
function access(auth, token) {
  const req = { get: () => `Bearer ${token}` }; const res = response(); let allowed = false;
  auth.authenticate(req, res, () => { allowed = true; });
  return { req, res, allowed };
}

test('temporary admin sessions expire, revoke individually and never echo the private password', () => {
  let time = 1000;
  const auth = createDevelopmentAdminAuth(config, { now: () => time });
  const first = login(auth); const second = login(auth);
  assert.equal(first.code, 200); assert.equal(first.body.username, 'admin'); assert.equal(first.body.role, 'admin');
  assert.match(first.body.token, /^[a-f0-9]{64}$/); assert.notEqual(first.body.token, password);
  assert.notEqual(first.body.token, second.body.token); assert.equal('password' in first.body, false);
  assert.equal(first.body.expiresAt, time + ADMIN_SESSION_TTL_MS);
  const authorized = access(auth, first.body.token);
  assert.equal(authorized.allowed, true); assert.equal(authorized.req.adminId, 'local-development-admin');
  const loggedOut = response(); auth.logout(authorized.req, loggedOut);
  assert.equal(loggedOut.code, 204); assert.equal(access(auth, first.body.token).allowed, false);
  assert.equal(access(auth, second.body.token).allowed, true);
  time = second.body.expiresAt;
  assert.equal(access(auth, second.body.token).allowed, false);
  assert.equal(access(auth, config.devAuthToken).allowed, false);
  assert.equal(access(auth, 'forged').allowed, false);
});

test('temporary login validates credentials and rejects role injection and production access', () => {
  const auth = createDevelopmentAdminAuth(config);
  for (const body of [{ username: 'user', password }, { username: 'admin', password: 'wrong' }, { username: 'admin', password: config.devAuthToken }]) {
    const reply = login(auth, body); assert.equal(reply.code, 401); assert.equal('token' in reply.body, false);
  }
  for (const body of [{}, [], { username: 'admin', password, role: 'admin' }, { username: {}, password }]) assert.equal(login(auth, body).code, 400);
  for (const override of [{ nodeEnv: 'production' }, { nodeEnv: 'test' }, { adminDevAuthEnabled: false }, { adminDevToken: '' }, { adminDevToken: config.devAuthToken }]) {
    assert.equal(login(createDevelopmentAdminAuth({ ...config, ...override })).code, 401);
  }
});

test('login attempts are limited and the window recovers without restarting', () => {
  let time = 0; const auth = createDevelopmentAdminAuth(config, { now: () => time });
  for (let i = 0; i < 10; i++) assert.equal(login(auth, { username: 'admin', password: 'wrong' }).code, 401);
  assert.equal(login(auth).code, 429);
  time += 60000;
  assert.equal(login(auth).code, 200);
});

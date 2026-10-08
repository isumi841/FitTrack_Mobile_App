import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createApp } from '../src/app.js';
import { createMemberIdentity, memberAuthConfig } from '../src/member-auth.js';
import { MemoryRepository } from '../test-support/memory-repository.js';
const require = createRequire(import.meta.url);
const { createAuthRouter } = require('../member1/routes/auth');
const { createSessionService } = require('../member1/services/session');
const { createUsersRouter } = require('../member1/routes/users');
const bcrypt = require('bcrypt');
const StoredUser = require('../member1/models/User');
const password = 'IntegrationTest1!';
const secret = 'isolated-member-integration-secret-1234567890';

async function harness(t) {
  const passwordHash = await bcrypt.hash(password, 4);
  const users = [1, 2].map(n => ({ _id: String(n).padStart(24, '0'), email: `member${n}@example.test`, passwordHash, authProvider: 'local', isEmailVerified: true }));
  const admins = [{ _id: '3'.padStart(24, '0'), email: 'admin@example.test', role: 'admin', passwordHash }];
  let sequence = 10;
  const model = (records, schemaModel) => ({
    find() { return { select() { return this; }, sort: async () => records }; },
    async create(data) { const record = { ...data, _id: String(sequence++).padStart(24, '0'), createdAt: new Date() }; records.push(record); return record; },
    async findByIdAndUpdate(id, update) { const record = records.find(r => r._id === id); if (record) Object.assign(record, update.$set); return record; },
    async findByIdAndDelete(id) { const index = records.findIndex(r => r._id === id); return index < 0 ? null : records.splice(index, 1)[0]; },
    findOne(filter) {
    // Exercise real schema setters when casting email lookups, without a database.
    if (schemaModel && filter.email) filter = schemaModel.findOne(filter).cast(schemaModel);
    const promise = Promise.resolve(records.find(record => Object.entries(filter).every(([key, value]) => value instanceof RegExp ? value.test(record[key]) : record[key] === value)) ?? null);
    promise.select = () => promise; promise.lean = () => promise; return promise;
  } });
  const User = model(users, StoredUser), Admin = model(admins);
  const config = { jwt: { secret, expiryMinutes: 60 }, oauth: {} };
  let clock = Date.now();
  const sessions = createSessionService(config, { now: () => new Date(clock) });
  const router = createAuthRouter({ User, Admin, EmailVerification: model([]), config, bcrypt,
    sessionService: sessions, oauthBroker: { registerRoutes() {}, async consumeHandoff({ code }) {
      if (code !== 'verified-handoff') throw Object.assign(new Error('Invalid sign-in code.'), { expose: true, status: 401 });
      return { email: 'verified@example.test', providerUserId: 'provider-user', isEmailVerified: true, displayName: 'Verified' };
    } }, socialVerifier: {}, sendVerificationEmail: async () => { throw new Error('No mail in tests.'); } });
  const auth = { router, rateLimiter: (_req, _res, next) => next(), identity: createMemberIdentity({ sessions, User, Admin }), adminIdentity: createMemberIdentity({ sessions, User, Admin }, 'admin') };
  auth.usersRouter = createUsersRouter({ User, Admin, requireAdmin: auth.adminIdentity });
  const app = createApp({ database: { ping: async () => true }, config: { devAuthEnabled: true, devAuthToken: 'legacy-token', adminDevAuthEnabled: true, adminDevToken: 'legacy-admin', nodeEnv: 'development' },
    corsOrigins: ['http://localhost:8081'], auth, repository: new MemoryRepository(), exerciseRepository: { list: async () => [] } });
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  async function request(path, method = 'GET', body, token) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method, headers: { Origin: 'http://localhost:8081', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  const login = email => request('/auth/login', 'POST', { email, password });
  return { request, login, users, admins, expire: () => { clock += 61 * 60000; } };
}

test('real login on the shared server scopes workout creation, history and mutations to each member', async t => {
  const { request, login } = await harness(t);
  const alice = (await login('member1@example.test')).body.session.accessToken;
  const bob = (await login('member2@example.test')).body.session.accessToken;
  const body = { workoutId: 'sample-gentle-start', requestId: randomUUID() };
  const a = await request('/member3/workout-sessions', 'POST', body, alice);
  const b = await request('/member3/workout-sessions', 'POST', body, bob);
  assert.equal(a.status, 201); assert.equal(b.status, 201);
  assert.notEqual(a.body.session.id, b.body.session.id);
  assert.equal(a.body.session.ownerId, `user:${'1'.padStart(24, '0')}`);
  const path = `/member3/workout-sessions/${a.body.session.id}`;
  assert.equal((await request(path, 'GET', undefined, bob)).status, 404);
  assert.equal((await request(path, 'PATCH', { revision: 0, operationId: randomUUID(), action: 'end' }, bob)).status, 404);
  assert.equal((await request(path, 'DELETE', { revision: 0 }, bob)).status, 404);
  const history = await request('/member3/workout-sessions', 'GET', undefined, bob);
  assert.deepEqual(history.body.sessions.map(s => s.id), [b.body.session.id]);
  assert.equal((await request('/member3/workout-sessions', 'GET', undefined, 'legacy-token')).status, 401);
});

test('admin login returns the mobile session contract and only persisted admins can access exercises', async t => {
  const { request, login, admins } = await harness(t);
  const result = await login('admin@example.test');
  assert.equal(result.status, 200); assert.equal(result.body.user.role, 'admin');
  assert.equal(result.body.user.authProvider, 'local'); assert.equal(result.body.user.isEmailVerified, true);
  const token = result.body.session.accessToken;
  assert.equal((await request('/member3/admin/access', 'GET', undefined, token)).status, 200);
  const member = (await login('member1@example.test')).body.session.accessToken;
  assert.equal((await request('/member3/admin/access', 'GET', undefined, member)).status, 403);
  assert.equal((await request('/member3/workout-sessions', 'GET', undefined, token)).status, 403);
  assert.equal((await request('/member3/admin/login', 'POST', { username: 'admin', password: 'legacy-admin' })).status, 401);
  admins.length = 0;
  assert.equal((await request('/member3/admin/access', 'GET', undefined, token)).status, 401);
});

test('expired, altered, deleted and unverified member sessions fail closed', async t => {
  const { request, login, users, expire } = await harness(t);
  const token = (await login('member1@example.test')).body.session.accessToken;
  const path = '/member3/workout-sessions';
  assert.equal((await request(path, 'GET', undefined, `${token}changed`)).status, 401);
  users[0].isEmailVerified = false;
  assert.equal((await request(path, 'GET', undefined, token)).status, 401);
  users[0].isEmailVerified = true;
  expire();
  assert.equal((await request(path, 'GET', undefined, token)).status, 401);
});

test('legacy uppercase SLIIT accounts remain reachable after real Mongoose query casting', async t => {
  const { login, users } = await harness(t);
  users[0].email = 'IT12345678@my.sliit.lk';
  assert.equal((await login('it12345678@my.sliit.lk')).status, 200);
  assert.equal((await login('IT12345678@my.sliit.lk')).status, 200);
  assert.equal((await login('it12345679@my.sliit.lk')).status, 404);
});

test('missing SMTP credentials do not silently enable development email delivery', () => {
  const config = memberAuthConfig({ MONGODB_URI: 'mongodb://localhost/test', JWT_SECRET: secret, NODE_ENV: 'development', EMAIL_MODE: 'smtp' });
  assert.equal(config.email.mode, 'smtp'); assert.equal(config.emailReady, false);
  assert.throws(() => memberAuthConfig({ MONGODB_URI: 'mongodb://localhost/test', JWT_SECRET: 'weak' }), /JWT_SECRET/);
});

test('admin user CRUD uses stable IDs, validates fields, and never exposes password hashes', async t => {
  const { request, login } = await harness(t);
  const token = (await login('admin@example.test')).body.session.accessToken;
  const member = (await login('member1@example.test')).body.session.accessToken;
  assert.equal((await request('/users')).status, 401);
  assert.equal((await request('/users', 'GET', undefined, member)).status, 403);
  const payload = { email: 'new@example.test', password, role: 'user', displayName: 'New Member', isEmailVerified: true };
  for (const patch of [{ password: '' }, { email: { $ne: null } }, { role: 'owner' }, { isEmailVerified: 'true' }, { passwordHash: 'injected' }]) {
    assert.equal((await request('/users', 'POST', { ...payload, ...patch }, token)).status, 400);
  }
  const result = await request('/users', 'POST', payload, token);
  assert.equal(result.status, 201);
  const id = result.body.user.id;
  assert.match(id, /^[a-f\d]{24}$/i);
  assert.equal(result.body.user.passwordHash, undefined);
  assert.equal((await request('/users', 'POST', payload, token)).status, 409);
  const list = await request('/users', 'GET', undefined, token);
  assert.ok(list.body.users.some(user => user.id === id));
  assert.ok(list.body.users.every(user => !user.passwordHash && !user._id));
  const updated = await request(`/users/${id}`, 'PUT', { displayName: 'Updated' }, token);
  assert.equal(updated.body.user.displayName, 'Updated');
  assert.equal((await request('/users/invalid', 'DELETE', undefined, token)).status, 400);
  assert.equal((await request(`/users/${id}`, 'DELETE', undefined, token)).status, 200);
  assert.equal((await request(`/users/${id}`, 'PUT', { displayName: 'Missing' }, token)).status, 404);
});

test('admin creation requires a stored administrator and does not switch the creator session', async t => {
  const { request, login, admins } = await harness(t);
  const payload = { email: 'second-admin@example.test', password };
  assert.equal((await request('/auth/admin/signup', 'POST', payload)).status, 401);
  const member = (await login('member1@example.test')).body.session.accessToken;
  assert.equal((await request('/auth/admin/signup', 'POST', payload, member)).status, 403);
  const token = (await login('admin@example.test')).body.session.accessToken;
  assert.equal((await request('/auth/admin/signup', 'POST', { ...payload, password: 'weak' }, token)).status, 400);
  const result = await request('/auth/admin/signup', 'POST', payload, token);
  assert.equal(result.status, 201); assert.equal(result.body.user.role, 'admin');
  assert.equal(result.body.session, undefined); assert.equal(result.body.user.passwordHash, undefined);
  assert.equal((await login(payload.email)).status, 200);
  admins.splice(0, 1);
  assert.equal((await request('/users', 'GET', undefined, token)).status, 401);
});

test('admins stored in users can manage exercises; demotion revokes existing admin JWT access', async t => {
  const { request, login, users } = await harness(t);
  users[0].role = 'admin';
  const loggedIn = await login('member1@example.test');
  assert.equal(loggedIn.body.user.role, 'admin');
  const token = loggedIn.body.session.accessToken;
  assert.equal((await request('/member3/admin/access', 'GET', undefined, token)).status, 200);
  assert.equal((await request('/auth/me', 'GET', undefined, token)).status, 200);
  assert.equal((await request(`/users/${users[0]._id}`, 'DELETE', undefined, token)).status, 409);
  assert.equal((await request(`/users/${users[0]._id}`, 'PUT', { role: 'user' }, token)).status, 409);
  users[0].role = 'user';
  assert.equal((await request('/users', 'GET', undefined, token)).status, 401);
  assert.equal((await request('/member3/admin/access', 'GET', undefined, token)).status, 401);
  assert.equal((await request('/auth/me', 'GET', undefined, token)).status, 401);
});

test('Google signup preview verifies identity but creates no account or login session', async t => {
  const { request, users } = await harness(t);
  const before = users.length;
  const result = await request('/auth/social/google', 'POST', { code: 'verified-handoff', preview: true });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.email, 'verified@example.test');
  assert.equal(result.body.user.isEmailVerified, true);
  assert.equal(result.body.session, undefined);
  assert.equal(users.length, before);
  assert.equal((await request('/auth/social/google', 'POST', { code: 'forged', preview: true })).status, 401);
});

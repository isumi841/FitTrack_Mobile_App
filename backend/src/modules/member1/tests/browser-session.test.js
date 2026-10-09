const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { IncomingMessage, ServerResponse } = require('node:http');
const { PassThrough } = require('node:stream');
const { createApp } = require('../app');
const { createAuthRouter } = require('../routes/auth');
const { createSessionService } = require('../services/session');
const { createMemoryModels } = require('./helpers/memory-models');

async function harness(t, production = false) {
  const models = createMemoryModels();
  let timestamp = Date.now();
  const config = { production, corsOrigins: ['http://localhost:8081'],
    jwt: { secret: 'isolated-browser-session-test-secret-only', expiryMinutes: 60 } };
  const admins = [];
  const Admin = { findOne(filter) { return { select() { return this; }, then(resolve) { return Promise.resolve(admins.find((item) => Object.entries(filter).every(([key, value]) => item[key] === value)) ?? null).then(resolve); } }; } };
  const emails = [];
  const app = createApp({ config, rateLimiter: (_req, _res, next) => next(), authRouter: createAuthRouter({
    ...models, Admin, config, now: () => new Date(timestamp),
    sendVerificationEmail: async (message) => { emails.push(message); },
    bcrypt: { hash: (value) => bcrypt.hash(value, 4), compare: bcrypt.compare },
  }) });
  // Exercise the full Express/CORS/JSON middleware without opening a network port.
  async function request(path, { method = 'GET', body, headers = {} } = {}) {
    const socket = new PassThrough();
    const req = new IncomingMessage(socket);
    req.method = method;
    req.url = '/api/auth' + path;
    const payload = body === undefined ? null : JSON.stringify(body);
    req.headers = Object.fromEntries(Object.entries({
      'Content-Type': 'application/json', Origin: 'http://localhost:8081',
      'X-FitTrack-Session': '1', ...(payload ? { 'Content-Length': String(Buffer.byteLength(payload)) } : {}), ...headers,
    }).map(([key, value]) => [key.toLowerCase(), value]));
    const res = new ServerResponse(req);
    const result = new Promise((resolve, reject) => {
      res.end = (data) => {
        try {
          resolve({ status: res.statusCode, headers: new Headers(res.getHeaders()), body: data ? JSON.parse(String(data)) : null });
        } catch (error) { reject(error); }
        return res;
      };
      app.handle(req, res, reject);
    });
    if (payload) req.push(payload);
    req.push(null);
    return result;
  }
  const user = { _id: 'member-one', email: 'member@example.test', authProvider: 'local', isEmailVerified: true, displayName: null };
  models.state.users.push(user);
  const session = await createSessionService(config, { now: () => new Date(timestamp) }).issue(user);
  return { request, session, models, emails, admins, advance(ms) { timestamp += ms; } };
}

test('browser reopening restores the authenticated account and original expiry from an HttpOnly cookie', async (t) => {
  const f = await harness(t);
  const saved = await f.request('/session', { method: 'POST', headers: { Authorization: `Bearer ${f.session.accessToken}` }, body: {} });
  assert.equal(saved.status, 200);
  assert.equal(saved.headers.get('access-control-allow-credentials'), 'true');
  assert.equal(saved.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  const cookie = saved.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\/api\/auth\/session/);
  assert.match(cookie, /Expires=/);
  const reopened = await f.request('/session', { headers: { Cookie: cookie.split(';')[0] } });
  assert.equal(reopened.status, 200);
  assert.equal(reopened.body.user.email, 'member@example.test');
  assert.deepEqual(reopened.body.session, f.session);
  assert.equal(reopened.headers.get('cache-control'), 'no-store');
  const me = await f.request('/me', { headers: { Authorization: `Bearer ${f.session.accessToken}` } });
  assert.equal(me.status, 200);
  assert.equal(me.body.session, undefined);
});

test('expired, malformed and deleted-account cookies cannot restore authentication', async (t) => {
  const f = await harness(t);
  for (const value of ['', 'invalid', '%E0%A4%A']) {
    const result = await f.request('/session', { headers: { Cookie: `fittrack_session=${value}` } });
    assert.equal(result.status, 401);
    assert.match(result.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  }
  f.models.state.users.length = 0;
  assert.equal((await f.request('/session', { headers: { Cookie: `fittrack_session=${f.session.accessToken}` } })).status, 401);
  f.advance(61 * 60 * 1000);
  assert.equal((await f.request('/session', { headers: { Cookie: `fittrack_session=${f.session.accessToken}` } })).status, 401);
});

test('logout clears the same cookie and production cookies require HTTPS', async (t) => {
  const f = await harness(t, true);
  const saved = await f.request('/session', { method: 'POST', headers: { Authorization: `Bearer ${f.session.accessToken}` }, body: {} });
  assert.match(saved.headers.get('set-cookie'), /Secure/);
  const logout = await f.request('/session', { method: 'DELETE' });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /fittrack_session=;/);
  assert.match(logout.headers.get('set-cookie'), /Path=\/api\/auth\/session/);
  assert.equal((await f.request('/session')).status, 401);
});

test('cookie endpoints reject unauthenticated writes, missing CSRF header and untrusted browser origins', async (t) => {
  const f = await harness(t);
  assert.equal((await f.request('/session', { method: 'POST', body: {} })).status, 401);
  assert.equal((await f.request('/session', { method: 'DELETE', headers: { 'X-FitTrack-Session': '' } })).status, 403);
  assert.equal((await f.request('/session', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
});

test('signup, email verification and login return an account that survives browser reopening', async (t) => {
  const f = await harness(t);
  const email = 'new-member@example.test';
  const password = 'TestPassword@123';
  assert.equal((await f.request('/signup', { method: 'POST', body: { email, password, confirmPassword: password } })).status, 201);
  assert.equal((await f.request('/verify-email', { method: 'POST', body: { email, otp: f.emails[0].otp } })).status, 201);
  const login = await f.request('/login', { method: 'POST', body: { email, password } });
  assert.equal(login.status, 200);
  const saved = await f.request('/session', { method: 'POST', body: {}, headers: { Authorization: `Bearer ${login.body.session.accessToken}` } });
  const restored = await f.request('/session', { headers: { Cookie: saved.headers.get('set-cookie').split(';')[0] } });
  assert.equal(restored.status, 200);
  assert.equal(restored.body.user.email, email);
  assert.equal(restored.body.user.id, login.body.user.id);
});


test('browser preflight allows only the configured origin and the session header', async (t) => {
  const f = await harness(t);
  const result = await f.request('/session', { method: 'OPTIONS', headers: {
    'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,x-fittrack-session,content-type',
  } });
  assert.equal(result.status, 204);
  assert.equal(result.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  assert.equal(result.headers.get('access-control-allow-credentials'), 'true');
  assert.match(result.headers.get('access-control-allow-headers'), /x-fittrack-session/);
});

test('admin login and cookie restoration retain the admin role and valid account fields', async (t) => {
  const f = await harness(t);
  const email = 'admin@example.test';
  const password = 'TestAdmin@123';
  f.admins.push({ _id: 'admin-1', email, role: 'admin', passwordHash: await bcrypt.hash(password, 4) });
  const login = await f.request('/admin/login', { method: 'POST', body: { email, password } });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.authProvider, 'local');
  assert.equal(login.body.user.isEmailVerified, true);
  const saved = await f.request('/session', { method: 'POST', body: {}, headers: { Authorization: `Bearer ${login.body.session.accessToken}` } });
  const restored = await f.request('/session', { headers: { Cookie: saved.headers.get('set-cookie').split(';')[0] } });
  assert.equal(restored.body.user.role, 'admin');
  assert.equal(restored.body.user.email, email);
});

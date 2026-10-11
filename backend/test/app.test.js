import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { createApp } from '../src/app.js';

async function serve(t, database, extra = {}) {
  const app = createApp({ database, corsOrigins: ['http://localhost:8081', 'http://localhost:8082'], ...extra });
  const server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  return `http://127.0.0.1:${server.address().port}`;
}

test('health performs a fresh ping for every request and returns a small uncached response', async t => {
  let pings = 0;
  const url = await serve(t, { ping: async () => { pings++; return true; } });
  for (let i = 0; i < 2; i++) {
    const response = await fetch(`${url}/api/health`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.deepEqual(await response.json(), { status: 'ok', database: 'available' });
  }
  assert.equal(pings, 2);
});

test('disconnection and ping exceptions return 503 without error details', async t => {
  let throws = false;
  const url = await serve(t, { ping: async () => {
    if (throws) throw new Error('mongodb+srv://private-user:private-password@example.invalid/test');
    return false;
  } });
  for (const failure of [false, true]) {
    throws = failure;
    const response = await fetch(`${url}/api/health`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'unavailable', database: 'unavailable' });
  }
});

test('health becomes unavailable while the service is stopping', async t => {
  const url = await serve(t, { ping: async () => { assert.fail('Must not ping while stopping'); } }, { isStopping: () => true });
  assert.equal((await fetch(`${url}/api/health`)).status, 503);
});

test('CORS allows both Expo origins and preflight, rejects other origins, and allows native clients', async t => {
  const url = await serve(t, { ping: async () => true });
  for (const origin of ['http://localhost:8081', 'http://localhost:8082']) {
    const response = await fetch(`${url}/api/health`, { headers: { Origin: origin } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    const preflight = await fetch(`${url}/api/health`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  }
  const forbidden = await fetch(`${url}/api/health`, { headers: { Origin: 'http://localhost:9999' } });
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.headers.get('access-control-allow-origin'), null);
  assert.equal((await fetch(`${url}/api/health`)).status, 200);
});

test('legacy record endpoints and health write methods remain unavailable', async t => {
  const url = await serve(t, { ping: async () => true });
  for (const [path, method] of [['/api/workout-sessions', 'GET'], ['/api/workout-sessions', 'POST'], ['/api/health', 'POST']]) {
    const response = await fetch(`${url}${path}`, { method });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Not found' });
  }
});

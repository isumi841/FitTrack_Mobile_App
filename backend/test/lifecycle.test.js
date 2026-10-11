import assert from 'node:assert/strict';
import test from 'node:test';
import { createService } from '../src/lifecycle.js';

const config = { port: 0, nodeEnv: 'test', mongodbUri: 'mongodb://example.invalid/test', corsOrigins: [] };
const logger = { info() {}, error() {} };

test('HTTP starts after connection and ping; shutdown closes HTTP and MongoDB once', async t => {
  const events = [];
  let server;
  const database = {
    connect: async () => { events.push('connect'); },
    ping: async () => { events.push('ping'); return true; },
    disconnect: async () => { assert.equal(server.listening, false); events.push('disconnect'); },
  };
  const service = createService({ config, database, logger: { ...logger, info: () => events.push('listening') } });
  t.after(() => service.stop());
  server = await service.start();
  assert.deepEqual(events, ['connect', 'ping', 'listening']);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
  assert.equal(response.status, 200);
  await Promise.all([service.stop(), service.stop()]);
  assert.equal(events.filter(event => event === 'disconnect').length, 1);
  assert.equal(server.listening, false);
});

test('connection or initial ping failures never start HTTP and return sanitized errors', async () => {
  for (const failConnect of [true, false]) {
    let closed = false;
    const service = createService({ config, logger: { ...logger, info: () => assert.fail('HTTP must not start') }, database: {
      connect: async () => { if (failConnect) throw new Error('private-password in driver details'); },
      ping: async () => false,
      disconnect: async () => { closed = true; },
    } });
    await assert.rejects(service.start(), error => {
      assert.match(error.message, /Backend startup failed/);
      assert.ok(!error.message.includes('private-password'));
      return true;
    });
    assert.equal(closed, true);
  }
});

test('a stop request during connection prevents HTTP startup', async () => {
  let connected;
  let disconnected = 0;
  const service = createService({ config, logger, database: {
    connect: () => new Promise(resolve => { connected = resolve; }),
    ping: async () => { assert.fail('Must not ping after stop'); },
    disconnect: async () => { disconnected++; },
  } });
  const starting = service.start();
  await service.stop();
  connected();
  assert.equal(await starting, undefined);
  assert.equal(disconnected, 1);
});

test('a port already in use closes the new database connection', async t => {
  const first = createService({ config, logger, database: { connect: async () => {}, ping: async () => true, disconnect: async () => {} } });
  t.after(() => first.stop());
  const server = await first.start();
  let closed = false;
  const second = createService({ config: { ...config, port: server.address().port }, logger, database: {
    connect: async () => {}, ping: async () => true, disconnect: async () => { closed = true; },
  } });
  await assert.rejects(second.start(), /PORT .* is already in use/);
  assert.equal(closed, true);
});

test('shutdown drains an in-flight health request before closing the database', async t => {
  let releasePing;
  let markStarted;
  let calls = 0;
  let disconnected = false;
  const started = new Promise(resolve => { markStarted = resolve; });
  const service = createService({ config, logger, database: {
    connect: async () => {},
    ping: async () => {
      if (++calls === 1) return true;
      markStarted();
      return new Promise(resolve => { releasePing = resolve; });
    },
    disconnect: async () => { disconnected = true; },
  } });
  t.after(() => service.stop());
  const server = await service.start();
  const response = fetch(`http://127.0.0.1:${server.address().port}/api/health`);
  await started;
  const stopping = service.stop();
  assert.equal(disconnected, false);
  releasePing(true);
  assert.equal((await response).status, 200);
  await stopping;
  assert.equal(disconnected, true);
});

test('development lifecycle initializes only its repository and listens on loopback', async t => {
  const events = [];
  const service = createService({ config: { ...config, nodeEnv: 'development', devAuthEnabled: true, host: '127.0.0.1' }, logger, database: {
    connect: async () => events.push('connect'), ping: async () => true, disconnect: async () => {},
    createSessionRepository: () => ({ initialize: async () => events.push('sessions-index') }),
  } });
  t.after(() => service.stop());
  const server = await service.start();
  assert.equal(server.address().address, '127.0.0.1');
  assert.deepEqual(events, ['connect', 'sessions-index']);
});

test('a stop request during session-index setup prevents HTTP startup', async () => {
  let release;
  let initialized;
  const started = new Promise(resolve => { initialized = resolve; });
  const service = createService({ config: { ...config, devAuthEnabled: true }, logger, database: {
    connect: async () => {}, ping: async () => true, disconnect: async () => {},
    createSessionRepository: () => ({ initialize: () => { initialized(); return new Promise(resolve => { release = resolve; }); } }),
  } });
  const starting = service.start();
  await started; await service.stop(); release();
  assert.equal(await starting, undefined);
});

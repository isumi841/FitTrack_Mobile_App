import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { createDatabase } from '../src/database.js';

test('database adapter only connects and pings, with collection/index creation disabled', async () => {
  const connection = new EventEmitter();
  const commands = [];
  const logs = [];
  let disconnects = 0;
  const odm = {
    connection,
    set: (name, value) => { assert.equal(name, 'bufferCommands'); assert.equal(value, false); },
    connect: async (_uri, options) => {
      assert.equal(options.autoCreate, false);
      assert.equal(options.autoIndex, false);
      assert.equal(options.serverSelectionTimeoutMS, 5000);
      connection.readyState = 1;
      connection.db = { command: async (...args) => { commands.push(args); return { ok: 1 }; } };
    },
    disconnect: async () => { disconnects++; connection.readyState = 0; connection.emit('disconnected'); },
  };
  const database = createDatabase({ odm, logger: { error: value => logs.push(value), warn: value => logs.push(value) } });
  assert.equal(await database.ping(), false);
  await database.connect('mongodb://example.invalid/test');
  assert.equal(await database.ping(), true);
  assert.deepEqual(commands, [[{ ping: 1 }, { timeoutMS: 3000 }]]);
  connection.emit('error', new Error('private-password'));
  assert.ok(!logs.join(' ').includes('private-password'));
  connection.readyState = 0;
  assert.equal(await database.ping(), false);
  await database.disconnect();
  assert.equal(disconnects, 1);
  assert.equal(logs.length, 1); // Planned shutdown does not report a disconnection failure.
});

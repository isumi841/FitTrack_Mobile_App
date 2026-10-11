import assert from 'node:assert/strict';
import test from 'node:test';
import { api, ApiError, READ_TIMEOUT_MS, WRITE_TIMEOUT_MS } from '../../src/features/workout/api.ts';
import { createExercise } from '../../src/features/exercises/admin-api.ts';

function setup(t) {
  const previous = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'http://api.example.invalid';
  t.after(() => { if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
}
const input = { workoutId: '1', requestId: 'test-request-0123456789', name: 'Test exercise', target: '12 reps', subtitle: '', cue: '', steps: ['Test step.'], position: 1, video: null };

test('exercise create recovers a lost response with the same payload and no duplicate record', async t => {
  setup(t);
  const saved = new Map(); const bodies = []; let recovering = 0;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    bodies.push(options.body);
    const values = JSON.parse(options.body);
    if (!saved.has(values.requestId)) saved.set(values.requestId, { ...values, id: 'saved-id', revision: 0 });
    if (bodies.length === 1) throw new TypeError('Response interrupted after commit');
    return Response.json({ exercise: saved.get(values.requestId) });
  });
  const result = await createExercise(input, 'test-admin-token', () => recovering++);
  assert.equal(result.exercise.id, 'saved-id');
  assert.equal(saved.size, 1); assert.equal(recovering, 1); assert.equal(bodies.length, 2);
  assert.equal(bodies[0], bodies[1]);
});

test('exercise create never retries validation/auth/conflict errors and retries network failure only once', async t => {
  setup(t);
  for (const status of [400, 401, 403, 409]) {
    const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Expected API error' }, { status }));
    await assert.rejects(createExercise(input, '', () => assert.fail('Must not recover rejected input')), error => error instanceof ApiError && error.status === status);
    assert.equal(fetch.mock.callCount(), 1); fetch.mock.restore();
  }
  let recoveries = 0;
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline'); });
  await assert.rejects(createExercise(input, '', () => recoveries++), error => error.kind === 'network');
  assert.equal(fetch.mock.callCount(), 2); assert.equal(recoveries, 1);
});

test('writes have a longer response budget than reads and deadlines report a timeout', async t => {
  setup(t);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  t.mock.method(globalThis, 'fetch', (_url, options) => new Promise((_resolve, reject) => {
    signal = options.signal;
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  const write = api('/admin/exercises', '', 'POST', input);
  const checkedWrite = assert.rejects(write, error => error.kind === 'timeout' && error.status === 0 && error.message.includes('30 seconds'));
  t.mock.timers.tick(READ_TIMEOUT_MS);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(WRITE_TIMEOUT_MS - READ_TIMEOUT_MS);
  await checkedWrite;
  const read = api('/workouts');
  const checkedRead = assert.rejects(read, error => error.kind === 'timeout' && error.message.includes('12 seconds'));
  t.mock.timers.tick(READ_TIMEOUT_MS);
  await checkedRead;
});

test('unreadable replies are not mislabeled as network errors and preserve unknown write outcomes', async t => {
  setup(t);
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('<html>upstream failure</html>', { status: 502 }));
  await assert.rejects(api('/admin/exercises', '', 'POST', input), error => error.kind === 'response' && error.status === 502 && !error.message.includes('<html>'));
  fetch.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 201 }));
  await assert.rejects(api('/admin/exercises', '', 'POST', input), error => error.kind === 'response' && error.status === 0);
});

test('a missing API address is a configuration error, not an uncertain create to replay', async t => {
  setup(t);
  delete process.env.EXPO_PUBLIC_API_URL;
  const fetch = t.mock.method(globalThis, 'fetch', async () => assert.fail('No configured API'));
  await assert.rejects(createExercise(input, '', () => assert.fail('Must not recover configuration errors')), /Configure EXPO_PUBLIC_API_URL/);
  assert.equal(fetch.mock.callCount(), 0);
});

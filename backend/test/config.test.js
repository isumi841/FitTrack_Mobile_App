import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { ConfigurationError, ENV_FILE, loadConfig, parseEnvironment } from '../src/config.js';

const settings = {
  PORT: '5001', NODE_ENV: 'development',
  MONGODB_URI: 'mongodb+srv://test-user:fake-test-value@example.invalid/test?authSource=admin',
  CORS_ORIGINS: 'http://localhost:8081,http://localhost:8082',
};

test('valid settings use the specified port, environment, and browser origins', () => {
  const config = parseEnvironment(settings);
  assert.equal(config.port, 5001);
  assert.equal(config.nodeEnv, 'development');
  assert.deepEqual(config.corsOrigins, ['http://localhost:8081', 'http://localhost:8082']);
});

test('admin development access needs a distinct strong token, test database and development mode', () => {
  const valid = { ...settings, ADMIN_DEV_AUTH: 'true', ADMIN_DEV_TOKEN: 'fedcba9876543210'.repeat(4), MEMBER3_DEV_TOKEN: '0123456789abcdef'.repeat(4) };
  assert.equal(parseEnvironment(valid).host, '127.0.0.1');
  assert.equal(parseEnvironment(valid).adminDevAuthEnabled, true);
  assert.equal(parseEnvironment(settings).adminDevAuthEnabled, false);
  for (const bad of [{ NODE_ENV: 'production' }, { NODE_ENV: 'test' }, { ADMIN_DEV_AUTH: 'yes' }, { ADMIN_DEV_TOKEN: '' }, { ADMIN_DEV_TOKEN: 'a'.repeat(64) }, { ADMIN_DEV_TOKEN: valid.MEMBER3_DEV_TOKEN }, { MONGODB_URI: settings.MONGODB_URI.replace('/test?', '/live?') }]) {
    assert.throws(() => parseEnvironment({ ...valid, ...bad }), ConfigurationError);
  }
});

test('missing settings fail with names only, without reflecting other settings', () => {
  assert.throws(() => parseEnvironment({ MONGODB_URI: 'private-value' }), error => {
    assert.ok(error instanceof ConfigurationError);
    assert.match(error.message, /PORT, NODE_ENV, CORS_ORIGINS/);
    assert.ok(!error.message.includes('private-value'));
    return true;
  });
});

test('literal and URL-encoded password placeholders are rejected before connection', () => {
  for (const value of ['<db_password>', '%3Cdb_password%3E', 'YOUR_PASSWORD', 'changeme']) {
    assert.throws(() => parseEnvironment({ ...settings, MONGODB_URI: settings.MONGODB_URI.replace('fake-test-value', value) }), /placeholder/);
  }
});

test('invalid ports, environments, URI formats, and browser origins are rejected safely', () => {
  const cases = [
    { PORT: '0' }, { PORT: '65536' }, { PORT: '5e3' }, { NODE_ENV: 'dev' },
    { MONGODB_URI: 'https://example.invalid/private-value' },
    { MONGODB_URI: 'mongodb+srv://example.invalid/test' },
    { MONGODB_URI: 'mongodb+srv://test-user:%broken@example.invalid/test' },
    { CORS_ORIGINS: '*' }, { CORS_ORIGINS: 'http://localhost:8081/path' },
    { CORS_ORIGINS: 'http://localhost:8081,' }, { CORS_ORIGINS: 'null' },
  ];
  for (const invalid of cases) {
    assert.throws(() => parseEnvironment({ ...settings, ...invalid }), error => {
      assert.ok(error instanceof ConfigurationError);
      assert.ok(!error.message.includes('private-value'));
      assert.ok(!error.message.includes('example.invalid'));
      return true;
    });
  }
});

test('dotenv uses an absolute backend path and preserves shell overrides', async t => {
  assert.equal(ENV_FILE, fileURLToPath(new URL('../.env', import.meta.url)));
  const directory = await mkdtemp(join(tmpdir(), 'fittrack-env-test-'));
  // This removes only the temporary test directory just created, never backend/.env.
  t.after(() => rm(directory, { recursive: true, force: true }));
  const envFile = join(directory, '.env');
  await writeFile(envFile, Object.entries(settings).map(([key, value]) => `${key}=${value}`).join('\n'));
  const env = { PORT: '5002' };
  const config = loadConfig({ envFile, env });
  assert.equal(config.port, 5002);
  assert.equal(config.nodeEnv, 'development');
  assert.equal(env.MONGODB_URI, settings.MONGODB_URI);
});

test('missing .env still validates supplied environment values', () => {
  const envFile = fileURLToPath(new URL('./not-created.env', import.meta.url));
  assert.equal(loadConfig({ envFile, env: { ...settings } }).port, 5001);
  assert.throws(() => loadConfig({ envFile, env: {} }), /Missing required settings/);
});

test('the actual entry point rejects placeholders with a nonzero exit and sanitized output', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../src/server.js', import.meta.url))], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: { ...process.env, ...settings, MONGODB_URI: settings.MONGODB_URI.replace('fake-test-value', '<db_password>') },
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /still contains a placeholder/);
  assert.ok(!result.stderr.includes('example.invalid'));
  assert.ok(!result.stderr.includes('test-user'));
  assert.equal(result.stdout, '');
});

test('development identity requires opt-in, strong token, test database, and loopback binding', () => {
  const valid = { ...settings, MEMBER3_DEV_AUTH: 'true', MEMBER3_DEV_TOKEN: '0123456789abcdef'.repeat(4) };
  assert.equal(parseEnvironment(valid).host, '127.0.0.1');
  assert.equal(parseEnvironment(settings).devAuthEnabled, false);
  for (const bad of [
    { NODE_ENV: 'production' }, { NODE_ENV: 'test' }, { MEMBER3_DEV_TOKEN: '' },
    { MEMBER3_DEV_TOKEN: 'a'.repeat(64) }, { MEMBER3_DEV_TOKEN: 'short' },
    { MEMBER3_DEV_AUTH: 'yes' }, { MONGODB_URI: settings.MONGODB_URI.replace('/test?', '/production?') },
  ]) assert.throws(() => parseEnvironment({ ...valid, ...bad }), ConfigurationError);
});

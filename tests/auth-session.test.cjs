const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const sessionKey = 'fittrack.member1.session';
const emailKey = 'fittrack.member1.email';

// Run the real TypeScript session and API modules with only platform storage and HTTP replaced.
// A fresh module graph models closing/reopening the app; durable stores remain shared.
function device(os = 'ios') {
  const durable = new Map();
  const requests = [];
  let now = Date.now();
  let cookieSession = null;
  let serverStatus = null;
  let storageFailure = false;
  let delayRead = null;
  const response = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const account = (role = 'user') => ({ success: true, message: 'Signed in.',
    user: { id: 'account-1', email: 'member@example.test', isEmailVerified: true, authProvider: 'local', displayName: null, role },
    session: { accessToken: 'test-session-token', expiresAt: new Date(now + 3600000).toISOString() },
  });
  let serverAccount = account();
  function reopen(entry = 'src/features/member1/auth/session.ts') {
    const cache = new Map();
    const secureStore = {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only',
      async getItemAsync(key) {
        if (storageFailure) throw new Error('Device is locked.');
        const value = durable.get(key) ?? null;
        if (delayRead && key === sessionKey) await delayRead;
        return value;
      },
      async setItemAsync(key, value) { if (storageFailure) throw new Error('Device is locked.'); durable.set(key, value); },
      async deleteItemAsync(key) { if (storageFailure) throw new Error('Device is locked.'); durable.delete(key); },
    };
    function load(filename) {
      if (cache.has(filename)) return cache.get(filename).exports;
      const module = { exports: {} }; cache.set(filename, module);
      const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      const context = { module, exports: module.exports, console, setTimeout, clearTimeout, AbortController,
        Date: class extends Date { static now() { return now; } },
        window: os === 'web' ? {} : undefined,
        localStorage: { getItem: (key) => durable.get(key) ?? null, setItem: (key, value) => durable.set(key, value), removeItem: (key) => durable.delete(key) },
        fetch: async (url, options) => {
          requests.push({ url, ...options });
          if (url.endsWith('/api/member4/profile')) {
            assert.equal(options.headers.Authorization, 'Bearer test-session-token');
            assert.equal(options.headers['x-user-id'], undefined);
            return response(200, { success: true, data: { userId: 'account-1', email: 'member@example.test' } });
          }
          assert.equal(options.credentials, 'include');
          assert.equal(options.headers['X-FitTrack-Session'], '1');
          if (serverStatus) return response(serverStatus, { success: false, message: 'Unavailable.' });
          if (options.method === 'POST') { cookieSession = serverAccount; return response(200, { success: true }); }
          if (options.method === 'DELETE') { cookieSession = null; return response(200, { success: true }); }
          if (!cookieSession || Date.parse(cookieSession.session.expiresAt) <= now) return response(401, { success: false, message: 'Please log in again.' });
          return response(200, cookieSession);
        },
        require: (name) => {
          if (name === 'expo-file-system') return { File: class {} };
          if (name === 'expo/fetch') return { fetch: () => { throw new Error('Unexpected upload request'); } };
          if (name === 'expo-secure-store') return secureStore;
          if (name === 'react-native') return { Platform: { OS: os } };
          if (name === '@/config/api') return { API_BASE_URL: 'http://localhost:5001' };
          const target = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(path.dirname(filename), name);
          return load(target + '.ts');
        },
      };
      vm.runInNewContext(code, context, { filename });
      return module.exports;
    }
    return load(path.join(root, entry));
  }
  return { durable, requests, account, reopen,
    advance(ms) { now += ms; }, failStorage(value) { storageFailure = value; },
    failServer(status) { serverStatus = status; }, delayRead(value) { delayRead = value; },
    setServerAccount(value) { serverAccount = value; },
  };
}

for (const os of ['ios', 'android', 'web']) {
  test(`${os}: reopening restores the same account and routes past onboarding`, async () => {
    const d = device(os);
    await d.reopen().saveAuthSession(d.account());
    const reopened = d.reopen();
    assert.equal((await reopened.getAuthSession()).user.email, 'member@example.test');
    assert.equal(await reopened.getStartupRoute(), '/member1_onboarding_personalization/personalized-plan');
    assert.equal(await reopened.getRememberedEmail(), 'member@example.test');
    if (os === 'web') assert.deepEqual([...d.durable.keys()], [emailKey]);
  });

  test(`${os}: expired sessions are not restored but the saved email survives`, async () => {
    const d = device(os);
    await d.reopen().saveAuthSession(d.account());
    d.advance(3600001);
    const reopened = d.reopen();
    assert.equal(await reopened.getAuthSession(), null);
    assert.equal(await reopened.getStartupRoute(), '/member1_onboarding_personalization/login');
    assert.equal(await reopened.getRememberedEmail(), 'member@example.test');
  });

  test(`${os}: opt-out clears prior saved identity, while current sign-in still works`, async () => {
    const d = device(os);
    const active = d.reopen();
    await active.saveAuthSession(d.account());
    await active.saveAuthSession(d.account(), { rememberMe: false });
    assert.equal((await active.getAuthSession()).user.id, 'account-1');
    const reopened = d.reopen();
    assert.equal(await reopened.getAuthSession(), null);
    assert.equal(await reopened.getRememberedEmail(), null);
  });

  test(`${os}: logout prevents automatic sign-in on reopening`, async () => {
    const d = device(os);
    const active = d.reopen();
    await active.saveAuthSession(d.account());
    await active.clearAuthSession();
    assert.equal(await d.reopen().getAuthSession(), null);
  });
}

test('a fresh install starts onboarding; a restored administrator opens admin pages', async () => {
  const d = device();
  assert.equal(await d.reopen().getStartupRoute(), '/member1_onboarding_personalization');
  await d.reopen().saveAuthSession(d.account('admin'));
  assert.equal(await d.reopen().getStartupRoute(), '/admin/users');
});

test('corrupt native session is removed without losing the remembered email', async () => {
  const d = device();
  d.durable.set(sessionKey, '{broken');
  d.durable.set(emailKey, 'member@example.test');
  assert.equal(await d.reopen().getStartupRoute(), '/member1_onboarding_personalization/login');
  assert.equal(d.durable.has(sessionKey), false);
});

test('temporary secure-storage failures do not delete a valid session', async () => {
  const d = device();
  await d.reopen().saveAuthSession(d.account());
  const reopened = d.reopen();
  d.failStorage(true);
  await assert.rejects(reopened.getAuthSession());
  assert.equal(d.durable.has(sessionKey), true);
  d.failStorage(false);
  assert.equal((await reopened.getAuthSession()).user.id, 'account-1');
});

test('browser network/server failures remain retryable instead of forgetting the account', async () => {
  const d = device('web');
  await d.reopen().saveAuthSession(d.account());
  const reopened = d.reopen();
  d.failServer(503);
  await assert.rejects(reopened.getAuthSession());
  d.failServer(null);
  assert.equal((await reopened.getAuthSession()).user.id, 'account-1');
});

test('a slow restore cannot resurrect an account after logout', async () => {
  const d = device();
  await d.reopen().saveAuthSession(d.account());
  let resume;
  d.delayRead(new Promise((resolve) => { resume = resolve; }));
  const reopened = d.reopen();
  const restore = reopened.getAuthSession();
  const logout = reopened.clearAuthSession();
  resume();
  await Promise.all([restore, logout]);
  assert.equal(await reopened.getAuthSession(), null);
  assert.equal(await d.reopen().getAuthSession(), null);
});

test('stored sessions contain only validated public account fields and token, never passwords', async () => {
  const d = device();
  await d.reopen().saveAuthSession({ ...d.account(), password: 'must-not-be-saved' });
  assert.equal(d.durable.get(sessionKey).includes('must-not-be-saved'), false);
});


test('older installations recover the email from an expired saved native session', async () => {
  const d = device();
  d.durable.set(sessionKey, JSON.stringify(d.account()));
  d.advance(3600001);
  const reopened = d.reopen();
  assert.equal(await reopened.getStartupRoute(), '/member1_onboarding_personalization/login');
  assert.equal(await reopened.getRememberedEmail(), 'member@example.test');
});


for (const os of ['ios', 'web']) {
  test(`${os}: profile requests after reopening use the restored account, never a demo identity`, async () => {
    const d = device(os);
    await d.reopen().saveAuthSession(d.account());
    const service = d.reopen('src/features/member4/services/member4Service.ts');
    const result = await service.getProfile();
    assert.equal(result.data.email, 'member@example.test');
    assert.equal(result.data.userId, 'account-1');
  });
}

test('an expired native session cannot fetch or write under a shared demo identity', async () => {
  const d = device();
  await d.reopen().saveAuthSession(d.account());
  d.advance(3600001);
  const service = d.reopen('src/features/member4/services/member4Service.ts');
  await assert.rejects(service.getProfile(), /session has expired/);
  await assert.rejects(service.createGoal({ title: 'Must not be sent' }), /session has expired/);
  assert.equal(d.requests.length, 0);
});

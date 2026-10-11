const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const express = require('express');
const { createOAuthBroker } = require('../services/oauth-broker');

const APP_RETURN = 'fittrackmobileapp://member1_onboarding_personalization/oauth-callback';
const WEB_RETURN = 'http://localhost:8081/member1_onboarding_personalization/oauth-callback';
const APP_STATE = 'frontend_state_0123456789';
const CODE_VERIFIER = 'a'.repeat(64);
const hash = (value) => createHash('sha256').update(value).digest('base64url');

function memoryModel() {
  const documents = [];
  return {
    documents,
    async create(document) {
      documents.push(structuredClone(document));
      return document;
    },
    findOneAndDelete(filter) {
      const matches = (document) => Object.entries(filter).every(([key, value]) => {
        if (value && typeof value === 'object' && '$gt' in value) return document[key] > value.$gt;
        return document[key] === value;
      });
      const query = {
        select() { return query; },
        async lean() {
          const index = documents.findIndex(matches);
          return index < 0 ? null : documents.splice(index, 1)[0];
        },
      };
      return query;
    },
  };
}

async function fixture(t) {
  const OAuthRequest = memoryModel();
  const OAuthHandoff = memoryModel();
  let time = new Date('2026-10-05T00:00:00Z');
  let googleNonce;
  let wrongNonce = false;
  let networkFailure = false;
  const exchanges = [];
  const config = { oauth: {
    googleClientIds: ['google-web-client'],
    googleClientSecret: 'private-google-secret',
    facebookAppId: 'facebook-app',
    facebookAppSecret: 'private-facebook-secret',
    facebookGraphVersion: 'v25.0',
    callbackBaseUrl: 'https://api.fittrack.example',
    redirectUris: [APP_RETURN, WEB_RETURN],
  } };
  const broker = createOAuthBroker({
    config, OAuthRequest, OAuthHandoff, now: () => time,
    fetchImpl: async (endpoint, options) => {
      if (networkFailure) throw new Error('sensitive-provider-error');
      exchanges.push({ endpoint, ...options });
      return { ok: true, json: async () => ({ id_token: 'private-id-token', access_token: 'private-access-token' }) };
    },
    verifier: {
      async google(token) {
        assert.equal(token, 'private-id-token');
        return { providerUserId: 'google-user', email: 'personal@gmail.com', isEmailVerified: true,
          displayName: 'Personal User', nonce: wrongNonce ? 'wrong-nonce' : googleNonce };
      },
      async facebook(token) {
        assert.equal(token, 'private-access-token');
        return { providerUserId: 'facebook-user', email: null, isEmailVerified: false, displayName: 'Facebook User' };
      },
    },
  });
  const app = express();
  const router = express.Router();
  broker.registerRoutes(router);
  app.use('/api/auth', router);
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ message: error.expose ? error.message : 'Unexpected error.' }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/auth`;
  async function authorize(provider = 'google', changes = {}) {
    const query = new URLSearchParams({ client_id: provider, redirect_uri: APP_RETURN,
      response_type: 'code', code_challenge: hash(CODE_VERIFIER), code_challenge_method: 'S256',
      state: APP_STATE, ...changes });
    const response = await fetch(`${base}/social/authorize?${query}`, { redirect: 'manual' });
    if (response.status === 302) googleNonce = new URL(response.headers.get('location')).searchParams.get('nonce');
    return response;
  }
  async function callback(authorization, provider = 'google', changes = {}) {
    const providerUrl = new URL(authorization.headers.get('location'));
    const query = new URLSearchParams({ state: providerUrl.searchParams.get('state'), code: 'provider-code', ...changes });
    return fetch(`${base}/social/callback/${provider}?${query}`, { redirect: 'manual' });
  }
  return { broker, OAuthRequest, OAuthHandoff, exchanges, authorize, callback, base,
    setWrongNonce: () => { wrongNonce = true; },
    failNetwork: () => { networkFailure = true; },
    advance: (milliseconds) => { time = new Date(time.getTime() + milliseconds); } };
}

test('Google authorization uses server callback, fresh state, nonce, account picker and provider PKCE', async (t) => {
  const f = await fixture(t);
  const response = await f.authorize();
  assert.equal(response.status, 302);
  const target = new URL(response.headers.get('location'));
  assert.equal(target.origin, 'https://accounts.google.com');
  assert.equal(target.searchParams.get('redirect_uri'), 'https://api.fittrack.example/api/auth/social/callback/google');
  assert.equal(target.searchParams.get('client_id'), 'google-web-client');
  assert.equal(target.searchParams.get('scope'), 'openid email profile');
  assert.equal(target.searchParams.get('prompt'), 'select_account');
  assert.equal(target.searchParams.get('code_challenge_method'), 'S256');
  assert.notEqual(target.searchParams.get('state'), APP_STATE);
  assert.equal(f.OAuthRequest.documents[0].providerStateHash, hash(target.searchParams.get('state')));
  assert.equal(f.OAuthRequest.documents[0].providerNonceHash, hash(target.searchParams.get('nonce')));
  assert.equal(target.searchParams.get('code_challenge'), hash(f.OAuthRequest.documents[0].providerCodeVerifier));
  assert.equal(target.searchParams.has('client_secret'), false);
  assert.equal(target.searchParams.has('hd'), false);
});

test('return addresses are exact allowlisted and S256 PKCE is required', async (t) => {
  const f = await fixture(t);
  for (const changes of [
    { redirect_uri: 'https://attacker.example/callback' },
    { redirect_uri: `${WEB_RETURN}?injected=1` },
    { code_challenge_method: 'plain' },
    { code_challenge: 'not-a-challenge' },
    { state: 'short' },
    { response_type: 'token' },
  ]) {
    assert.equal((await f.authorize('google', changes)).status, 400);
  }
  assert.equal(f.OAuthRequest.documents.length, 0);
  assert.equal((await f.authorize('google', { redirect_uri: WEB_RETURN })).status, 302);
});

test('Google verified callback emits only a short-lived handoff bound to original state and PKCE', async (t) => {
  const f = await fixture(t);
  const authorization = await f.authorize();
  const callback = await f.callback(authorization);
  assert.equal(callback.status, 302);
  const returned = new URL(callback.headers.get('location'));
  assert.equal(returned.searchParams.get('state'), APP_STATE);
  const code = returned.searchParams.get('code');
  assert.match(code, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(returned.toString().includes('private-'), false);
  assert.equal(f.OAuthRequest.documents.length, 0);
  assert.equal(f.OAuthHandoff.documents[0].codeHash, hash(code));
  assert.equal(JSON.stringify(f.OAuthHandoff.documents).includes('private-'), false);
  const body = new URLSearchParams(f.exchanges[0].body);
  assert.equal(body.get('client_secret'), 'private-google-secret');
  assert.equal(body.get('grant_type'), 'authorization_code');
  assert.ok(body.get('code_verifier'));
  assert.equal(f.exchanges[0].endpoint, 'https://oauth2.googleapis.com/token');
  assert.equal((await f.callback(authorization)).status, 400);
  for (const overrides of [{ codeVerifier: 'b'.repeat(64) }, { redirectUri: WEB_RETURN }, { provider: 'facebook' }]) {
    await assert.rejects(f.broker.consumeHandoff({ provider: 'google', code, codeVerifier: CODE_VERIFIER,
      redirectUri: APP_RETURN, ...overrides }), { status: 401 });
  }
  const identity = await f.broker.consumeHandoff({ provider: 'google', code, codeVerifier: CODE_VERIFIER, redirectUri: APP_RETURN });
  assert.equal(identity.email, 'personal@gmail.com');
  assert.equal(identity.providerUserId, 'google-user');
  await assert.rejects(f.broker.consumeHandoff({ provider: 'google', code, codeVerifier: CODE_VERIFIER, redirectUri: APP_RETURN }), { status: 401 });
});

test('Facebook code is exchanged server-side and profile identity comes from backend verifier', async (t) => {
  const f = await fixture(t);
  const authorization = await f.authorize('facebook');
  const providerUrl = new URL(authorization.headers.get('location'));
  assert.equal(providerUrl.origin, 'https://www.facebook.com');
  assert.equal(providerUrl.pathname, '/v25.0/dialog/oauth');
  assert.equal(providerUrl.searchParams.get('client_id'), 'facebook-app');
  assert.equal(providerUrl.searchParams.has('client_secret'), false);
  const callback = await f.callback(authorization, 'facebook');
  const returned = new URL(callback.headers.get('location'));
  const identity = await f.broker.consumeHandoff({ provider: 'facebook', code: returned.searchParams.get('code'),
    codeVerifier: CODE_VERIFIER, redirectUri: APP_RETURN });
  assert.equal(identity.providerUserId, 'facebook-user');
  assert.equal(identity.email, null);
  assert.equal(f.exchanges[0].endpoint, 'https://graph.facebook.com/v25.0/oauth/access_token');
  assert.equal(new URLSearchParams(f.exchanges[0].body).get('client_secret'), 'private-facebook-secret');
});

test('cancellation preserves app state without forwarding provider descriptions', async (t) => {
  const f = await fixture(t);
  const authorization = await f.authorize();
  const callback = await f.callback(authorization, 'google', { error: 'access_denied', error_description: 'sensitive-provider-detail' });
  const returned = new URL(callback.headers.get('location'));
  assert.equal(returned.searchParams.get('error'), 'access_denied');
  assert.equal(returned.searchParams.get('state'), APP_STATE);
  assert.equal(returned.searchParams.has('error_description'), false);
  assert.equal(f.exchanges.length, 0);
  assert.equal(f.OAuthHandoff.documents.length, 0);
});

test('wrong nonce or token exchange failure produces a safe error and no handoff', async (t) => {
  for (const failure of ['nonce', 'network']) {
    const f = await fixture(t);
    const authorization = await f.authorize();
    if (failure === 'nonce') f.setWrongNonce(); else f.failNetwork();
    const callback = await f.callback(authorization);
    const returned = new URL(callback.headers.get('location'));
    assert.equal(returned.searchParams.get('error'), 'server_error');
    assert.equal(returned.searchParams.get('state'), APP_STATE);
    assert.equal(returned.searchParams.has('code'), false);
    assert.equal(f.OAuthHandoff.documents.length, 0);
    assert.equal(f.OAuthRequest.documents.length, 0);
  }
});

test('provider states expire in five minutes and handoff codes expire in sixty seconds', async (t) => {
  const f = await fixture(t);
  const oldAuthorization = await f.authorize();
  f.advance(5 * 60 * 1000);
  assert.equal((await f.callback(oldAuthorization)).status, 400);
  const authorization = await f.authorize();
  const callback = await f.callback(authorization);
  const code = new URL(callback.headers.get('location')).searchParams.get('code');
  f.advance(60 * 1000);
  await assert.rejects(f.broker.consumeHandoff({ provider: 'google', code, codeVerifier: CODE_VERIFIER,
    redirectUri: APP_RETURN }), { status: 401 });
});

test('simultaneous handoff redemption authenticates exactly one request', async (t) => {
  const f = await fixture(t);
  const callback = await f.callback(await f.authorize());
  const code = new URL(callback.headers.get('location')).searchParams.get('code');
  const results = await Promise.allSettled(Array.from({ length: 4 }, () => f.broker.consumeHandoff({
    provider: 'google', code, codeVerifier: CODE_VERIFIER, redirectUri: APP_RETURN,
  })));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 3);
});

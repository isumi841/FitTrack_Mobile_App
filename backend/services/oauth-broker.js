const { randomBytes, createHash, timingSafeEqual } = require('node:crypto');

const AUTHORIZATION_LIFETIME_MS = 5 * 60 * 1000;
const HANDOFF_LIFETIME_MS = 60 * 1000;
const TOKEN_TIMEOUT_MS = 15 * 1000;
const PROVIDERS = ['google', 'facebook'];

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('base64url');
}

function randomToken() {
  return randomBytes(32).toString('base64url');
}

function validText(value, minimum = 1, maximum = 2048) {
  return typeof value === 'string' && value.length >= minimum && value.length <= maximum &&
    !/[\s\x00-\x1f\x7f]/.test(value);
}

function equalHash(first, second) {
  return typeof first === 'string' && typeof second === 'string' && first.length === second.length &&
    timingSafeEqual(Buffer.from(first), Buffer.from(second));
}

/**
 * Providers return codes to this confidential server, never to a Google native
 * custom scheme. The app receives a 60-second, single-use, PKCE-bound handoff.
 */
function createOAuthBroker({
  config,
  verifier,
  OAuthRequest = require('../models/SocialOAuthRequest'),
  OAuthHandoff = require('../models/SocialOAuthHandoff'),
  fetchImpl = fetch,
  now = () => new Date(),
}) {
  const oauth = config.oauth ?? {};
  const currentTime = () => new Date(now());

  function requireProvider(provider) {
    if (!PROVIDERS.includes(provider)) throw httpError(400, 'Unsupported sign-in provider.');
    const configured = oauth.callbackBaseUrl && oauth.redirectUris?.length && (provider === 'google'
      ? oauth.googleClientIds?.[0] && oauth.googleClientSecret
      : oauth.facebookAppId && oauth.facebookAppSecret && oauth.facebookGraphVersion);
    if (!configured) throw httpError(503, 'This sign-in provider is not configured yet.');
    return provider;
  }

  function callbackUri(provider) {
    return `${oauth.callbackBaseUrl.replace(/\/$/, '')}/api/auth/social/callback/${provider}`;
  }

  function appReturn(request, parameters) {
    const destination = new URL(request.redirectUri);
    for (const [key, value] of Object.entries({ ...parameters, state: request.appState })) {
      destination.searchParams.set(key, value);
    }
    return destination.toString();
  }

  async function fetchToken(endpoint, parameters) {
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams(parameters).toString(),
        signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error('Token exchange rejected.');
      const data = await response.json();
      if (!data || typeof data !== 'object' || data.error) throw new Error('Invalid token response.');
      return data;
    } catch {
      // Provider errors can contain tokens/client configuration. Never expose them.
      throw httpError(401, 'Unable to verify the provider sign-in. Please try again.');
    }
  }

  function registerRoutes(router) {
    router.get('/social/authorize', async (req, res) => {
      const provider = requireProvider(req.query.client_id);
      const { redirect_uri: redirectUri, state, code_challenge: challenge } = req.query;
      if (req.query.response_type !== 'code' || req.query.code_challenge_method !== 'S256' ||
          !validText(redirectUri) || !oauth.redirectUris.includes(redirectUri) ||
          !validText(state, 8, 256) || typeof challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
        throw httpError(400, 'Invalid sign-in request or return address.');
      }

      const providerState = randomToken();
      const providerCodeVerifier = provider === 'google' ? randomToken() : null;
      const nonce = provider === 'google' ? randomToken() : null;
      await OAuthRequest.create({
        provider,
        providerStateHash: sha256(providerState),
        appState: state,
        redirectUri,
        codeChallenge: challenge,
        providerCodeVerifier,
        providerNonceHash: nonce ? sha256(nonce) : null,
        expiresAt: new Date(currentTime().getTime() + AUTHORIZATION_LIFETIME_MS),
      });

      const authorization = new URL(provider === 'google'
        ? 'https://accounts.google.com/o/oauth2/v2/auth'
        : `https://www.facebook.com/${oauth.facebookGraphVersion}/dialog/oauth`);
      const parameters = {
        client_id: provider === 'google' ? oauth.googleClientIds[0] : oauth.facebookAppId,
        redirect_uri: callbackUri(provider),
        response_type: 'code',
        scope: provider === 'google' ? 'openid email profile' : 'public_profile,email',
        state: providerState,
      };
      if (provider === 'google') Object.assign(parameters, {
        prompt: 'select_account',
        nonce,
        code_challenge: sha256(providerCodeVerifier),
        code_challenge_method: 'S256',
      });
      for (const [key, value] of Object.entries(parameters)) authorization.searchParams.set(key, value);
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.redirect(authorization.toString());
    });

    router.get('/social/callback/:provider', async (req, res) => {
      const provider = requireProvider(req.params.provider);
      if (!validText(req.query.state, 43, 43)) throw httpError(400, 'Invalid or expired sign-in request.');
      // Consume provider state before network work. Concurrent/replayed callbacks
      // cannot create multiple handoff codes, even when token exchange fails.
      const request = await OAuthRequest.findOneAndDelete({
        provider,
        providerStateHash: sha256(req.query.state),
        expiresAt: { $gt: currentTime() },
      }).select('+providerCodeVerifier +providerNonceHash').lean();
      if (!request) throw httpError(400, 'Invalid or expired sign-in request.');

      res.setHeader('Referrer-Policy', 'no-referrer');
      if (req.query.error) {
        return res.redirect(appReturn(request, {
          error: req.query.error === 'access_denied' ? 'access_denied' : 'server_error',
        }));
      }

      try {
        if (!validText(req.query.code, 1, 4096)) throw new Error('Provider code missing.');
        const parameters = {
          client_id: provider === 'google' ? oauth.googleClientIds[0] : oauth.facebookAppId,
          client_secret: provider === 'google' ? oauth.googleClientSecret : oauth.facebookAppSecret,
          code: req.query.code,
          redirect_uri: callbackUri(provider),
        };
        if (provider === 'google') Object.assign(parameters, {
          grant_type: 'authorization_code', code_verifier: request.providerCodeVerifier,
        });
        const tokens = await fetchToken(provider === 'google'
          ? 'https://oauth2.googleapis.com/token'
          : `https://graph.facebook.com/${oauth.facebookGraphVersion}/oauth/access_token`, parameters);
        const identity = provider === 'google'
          ? await verifier.google(tokens.id_token)
          : await verifier.facebook(tokens.access_token);
        if (!identity || !validText(identity.providerUserId, 1, 256) ||
            (provider === 'google' && (!validText(identity.nonce, 1, 256) ||
              !equalHash(sha256(identity.nonce), request.providerNonceHash)))) {
          throw new Error('Provider identity or nonce invalid.');
        }

        const code = randomToken();
        await OAuthHandoff.create({
          provider,
          codeHash: sha256(code),
          codeChallenge: request.codeChallenge,
          redirectUri: request.redirectUri,
          identity: {
            providerUserId: identity.providerUserId,
            email: identity.email ?? null,
            isEmailVerified: identity.isEmailVerified === true,
            displayName: identity.displayName ?? null,
          },
          expiresAt: new Date(currentTime().getTime() + HANDOFF_LIFETIME_MS),
        });
        return res.redirect(appReturn(request, { code }));
      } catch {
        return res.redirect(appReturn(request, { error: 'server_error' }));
      }
    });
  }

  async function consumeHandoff({ provider, code, codeVerifier, redirectUri }) {
    requireProvider(provider);
    if (!validText(code, 43, 43) || typeof codeVerifier !== 'string' ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier) ||
        !validText(redirectUri) || !oauth.redirectUris.includes(redirectUri)) {
      throw httpError(401, 'Invalid or expired sign-in code. Please sign in again.');
    }
    const result = await OAuthHandoff.findOneAndDelete({
      provider,
      codeHash: sha256(code),
      codeChallenge: sha256(codeVerifier),
      redirectUri,
      expiresAt: { $gt: currentTime() },
    }).lean();
    if (!result) throw httpError(401, 'Invalid or expired sign-in code. Please sign in again.');
    return result.identity;
  }

  return { registerRoutes, consumeHandoff };
}

module.exports = { createOAuthBroker };

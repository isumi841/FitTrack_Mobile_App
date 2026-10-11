const { createHmac } = require('node:crypto');
const { isValidEmail, normalizeEmail } = require('../utils/validation');

function socialError(status, message) {
  return Object.assign(new Error(message), { status, expose: true });
}

function displayName(value) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 200) : null;
}

function providerEmail(value, verified) {
  return verified && isValidEmail(value) ? normalizeEmail(value) : null;
}

/** Only signed claims or a server-to-server provider response supply identity. */
function createSocialVerifier(config, { googleKeys, appleKeys, fetchImpl = fetch, now = () => new Date() } = {}) {
  const oauth = config.oauth || {};
  let keys;
  async function signingKeys() {
    if (!keys) {
      const { createRemoteJWKSet } = await import('jose');
      keys = {
        google: googleKeys || createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), { timeoutDuration: 10000 }),
        apple: appleKeys || createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'), { timeoutDuration: 10000 }),
      };
    }
    return keys;
  }

  async function verifyJwt(provider, token) {
    const audiences = provider === 'google' ? oauth.googleClientIds : oauth.appleClientIds;
    if (!audiences?.length) throw socialError(503, `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not configured yet.`);
    if (typeof token !== 'string' || token.length < 20 || token.length > 16000) {
      throw socialError(400, 'A valid provider identity token is required.');
    }
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(token, (await signingKeys())[provider], {
        issuer: provider === 'google' ? ['https://accounts.google.com', 'accounts.google.com'] : 'https://appleid.apple.com',
        audience: audiences, algorithms: ['RS256'], requiredClaims: ['sub', 'iat', 'exp', 'nonce'],
        currentDate: new Date(now()),
      });
      if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255 ||
          typeof payload.nonce !== 'string' || !payload.nonce ||
          payload.iat > Math.floor(new Date(now()).getTime() / 1000) + 30 ||
          (provider === 'google' && payload.azp !== undefined && !audiences.includes(payload.azp))) {
        throw new Error('Invalid provider claims.');
      }
      const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
      const email = providerEmail(payload.email, emailVerified);
      return {
        providerUserId: payload.sub, email, isEmailVerified: email !== null,
        displayName: displayName(payload.name), nonce: payload.nonce,
      };
    } catch (error) {
      if (error.code === 'ERR_JWKS_TIMEOUT' || error instanceof TypeError) {
        throw socialError(503, 'The identity provider is unavailable. Please try again.');
      }
      throw socialError(401, 'The provider identity could not be verified. Please sign in again.');
    }
  }

  async function graph(path, params, accessToken) {
    const url = new URL(`https://graph.facebook.com/${oauth.facebookGraphVersion}/${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error('Facebook rejected the request.');
    return result;
  }

  async function facebook(accessToken) {
    if (!oauth.facebookAppId || !oauth.facebookAppSecret || !oauth.facebookGraphVersion) {
      throw socialError(503, 'Facebook sign-in is not configured yet.');
    }
    if (typeof accessToken !== 'string' || !accessToken || accessToken.length > 16000) {
      throw socialError(400, 'A Facebook access token is required.');
    }
    try {
      const { data } = await graph('debug_token', { input_token: accessToken }, `${oauth.facebookAppId}|${oauth.facebookAppSecret}`);
      const time = Math.floor(new Date(now()).getTime() / 1000);
      if (data?.is_valid !== true || String(data.app_id) !== oauth.facebookAppId || data.type !== 'USER' ||
          typeof data.user_id !== 'string' || !data.user_id || data.user_id.length > 255 ||
          !Number.isFinite(data.expires_at) || data.expires_at <= time ||
          (data.data_access_expires_at !== undefined && data.data_access_expires_at !== 0 && data.data_access_expires_at <= time)) {
        throw new Error('Invalid Facebook token.');
      }
      const profile = await graph('me', {
        fields: 'id,name,email',
        appsecret_proof: createHmac('sha256', oauth.facebookAppSecret).update(accessToken).digest('hex'),
      }, accessToken);
      if (profile.id !== data.user_id) throw new Error('Facebook subject mismatch.');
      // Facebook does not provide an email_verified claim. Provider authentication
      // is trusted independently; a supplied email is not treated as verified.
      const email = isValidEmail(profile.email) ? normalizeEmail(profile.email) : null;
      return { providerUserId: profile.id, email, isEmailVerified: false, displayName: displayName(profile.name) };
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError' || error instanceof TypeError) {
        throw socialError(503, 'Facebook is unavailable. Please try again.');
      }
      throw socialError(401, 'The Facebook identity could not be verified. Please sign in again.');
    }
  }

  return { google: (token) => verifyJwt('google', token), apple: (token) => verifyJwt('apple', token), facebook };
}

module.exports = { createSocialVerifier };

const { randomUUID } = require('node:crypto');

const ISSUER = 'fittrack-auth';
const AUDIENCE = 'fittrack-mobile';

function createSessionService(config, { now = () => new Date() } = {}) {
  const secret = config.jwt?.secret;
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 UTF-8 bytes.');
  }
  const key = new TextEncoder().encode(secret);
  const lifetimeSeconds = (config.jwt.expiryMinutes ?? 60) * 60;

  async function issue(user) {
    const { SignJWT } = await import('jose');
    const issuedAt = Math.floor(new Date(now()).getTime() / 1000);
    const expiresAt = issuedAt + lifetimeSeconds;
    const role = user.role || 'user';
    const accessToken = await new SignJWT({ provider: user.authProvider || 'local', role })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(ISSUER).setAudience(AUDIENCE).setSubject(String(user._id))
      .setJti(randomUUID()).setIssuedAt(issuedAt).setExpirationTime(expiresAt).sign(key);
    return { accessToken, expiresAt: new Date(expiresAt * 1000).toISOString() };
  }

  async function verify(accessToken) {
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(accessToken, key, {
      algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE, typ: 'JWT',
      requiredClaims: ['sub', 'exp', 'iat', 'jti'], currentDate: new Date(now()),
    });
    if (!payload.sub || !['local', 'google', 'apple', 'facebook'].includes(payload.provider)) {
      throw new Error('Invalid session claims.');
    }
    return payload;
  }

  return { issue, verify };
}

module.exports = { createSessionService };

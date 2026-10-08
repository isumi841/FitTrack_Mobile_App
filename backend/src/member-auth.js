import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { loadConfig } = require('../member1/config');
const { createAuthRouter } = require('../member1/routes/auth');
const { createSessionService } = require('../member1/services/session');
const { createEmailService } = require('../member1/services/email');
const { createSocialVerifier } = require('../member1/services/social-verification');
const { createOAuthBroker } = require('../member1/services/oauth-broker');
const { createAuthRateLimiter } = require('../member1/middleware/auth-rate-limit');
const { createAdminIdentity } = require('../member1/services/admin-access');
const { createUsersRouter } = require('../member1/routes/users');

export function memberAuthConfig(env) {
  if (!env.JWT_SECRET) return undefined;
  // Keep existing-account login available while SMTP credentials are being set.
  // These placeholders are never used to send mail.
  const emailReady = env.EMAIL_MODE === 'development' || ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'].every(key => env[key]?.trim());
  const config = loadConfig({ ...env, EMAIL_MODE: env.EMAIL_MODE || 'smtp',
    EMAIL_HOST: env.EMAIL_HOST || 'smtp.invalid', EMAIL_USER: env.EMAIL_USER || 'unconfigured',
    EMAIL_PASS: env.EMAIL_PASS || 'unconfigured', EMAIL_FROM: env.EMAIL_FROM || 'unconfigured@example.invalid' });
  return { ...config, emailReady: Boolean(emailReady) };
}

export function createMemberIdentity({ sessions, User, Admin }, role = 'user') {
  if (role === 'admin') return createAdminIdentity({ sessions, User, Admin });
  return async (req, res, next) => {
    const authorization = req.get('Authorization') ?? '';
    let claims;
    try {
      if (!/^Bearer \S+$/.test(authorization)) throw new Error();
      claims = await sessions.verify(authorization.slice(7));
      if (!/^[a-f\d]{24}$/i.test(claims.sub)) throw new Error();
    } catch { return res.status(401).json({ error: 'Please log in again. Your session is missing or expired.' }); }
    if ((claims.role ?? 'user') !== role) return res.status(403).json({ error: role === 'admin' ? 'Admin access required.' : 'A member account is required.' });
    const account = await (role === 'admin' ? Admin : User).findOne({ _id: claims.sub });
    if (!account || (role === 'admin' ? account.role !== 'admin'
      : (account.role || 'user') !== 'user' || (account.authProvider || 'local') !== claims.provider || (claims.provider === 'local' && !account.isEmailVerified))) {
      return res.status(401).json({ error: 'This account is no longer available. Please log in again.' });
    }
    if (role === 'admin') req.adminId = `admin:${account._id}`;
    else req.ownerId = `user:${account._id}`;
    next();
  };
}

export function createMemberAuth(odm, config, { onAccountEvent } = {}) {
  const models = {};
  for (const name of ['User', 'Admin', 'EmailVerification', 'AuthEmailLock', 'SocialAuthChallenge', 'SocialOAuthRequest', 'SocialOAuthHandoff']) {
    const source = require(`../member1/models/${name}`);
    models[name] = odm.models[name] ?? odm.model(name, source.schema.clone(), source.collection.name);
  }
  const sessions = createSessionService(config);
  const verifier = createSocialVerifier(config);
  const oauthBroker = createOAuthBroker({ config, verifier, OAuthRequest: models.SocialOAuthRequest, OAuthHandoff: models.SocialOAuthHandoff });
  const email = config.emailReady ? createEmailService(config) : { sendVerificationEmail: async () => { throw new Error('SMTP is not configured.'); } };
  const router = createAuthRouter({ ...models, config, ...email, onAccountEvent, sessionService: sessions, socialVerifier: verifier, oauthBroker });
  const usersRouter = createUsersRouter({ ...models, requireAdmin: createAdminIdentity({ sessions, ...models }) });
  return { router, usersRouter, rateLimiter: createAuthRateLimiter(),
    identity: createMemberIdentity({ sessions, ...models }), adminIdentity: createMemberIdentity({ sessions, ...models }, 'admin'),
    async initialize() {
      // Add required unique/TTL indexes without dropping existing team indexes.
      for (const model of Object.values(models)) await model.createIndexes();
    },
  };
}

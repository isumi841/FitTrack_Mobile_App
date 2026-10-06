import { randomBytes, timingSafeEqual } from 'node:crypto';
import { developmentAdminIdentity } from './identity.js';

export const ADMIN_SESSION_TTL_MS = 60 * 60 * 1000;
// Temporary, process-local adapter. Replace with the team's verified admin login.
export function createDevelopmentAdminAuth(config = {}, { now = Date.now } = {}) {
  const sessions = new Map();
  const legacyIdentity = developmentAdminIdentity(config);
  let attempts = 0; let resetAt = 0;
  const enabled = () => config.nodeEnv === 'development' && config.adminDevAuthEnabled && !!config.adminDevToken && config.adminDevToken !== config.devAuthToken;
  const prune = () => { for (const [token, expiry] of sessions) if (expiry <= now()) sessions.delete(token); };
  return {
    login(req, res) {
      if (!enabled()) return res.status(401).json({ error: 'Temporary admin login is disabled.' });
      if (now() >= resetAt) { attempts = 0; resetAt = now() + 60000; }
      if (++attempts > 10) return res.status(429).json({ error: 'Too many login attempts. Wait one minute and retry.' });
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['username', 'password'].includes(key)) || typeof body.username !== 'string' || typeof body.password !== 'string') return res.status(400).json({ error: 'Enter an admin username and password.' });
      const password = Buffer.from(body.password);
      const expected = Buffer.from(config.adminDevToken);
      if (password.length !== expected.length || !timingSafeEqual(password, expected) || body.username.trim() !== 'admin') return res.status(401).json({ error: 'Incorrect admin username or password.' });
      prune();
      if (sessions.size >= 64) return res.status(503).json({ error: 'Too many active admin sessions. Log out of another session and retry.' });
      const token = randomBytes(32).toString('hex');
      const expiresAt = now() + ADMIN_SESSION_TTL_MS;
      sessions.set(token, expiresAt);
      return res.json({ token, expiresAt, username: 'admin', role: 'admin' });
    },
    authenticate(req, res, next) {
      prune();
      const authorization = req.get('Authorization') ?? '';
      const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (enabled() && sessions.has(token)) {
        req.adminId = 'local-development-admin'; req.adminSessionToken = token;
        return next();
      }
      // Preserve the private-token integration boundary for existing API clients.
      return legacyIdentity(req, res, next);
    },
    logout(req, res) {
      if (req.adminSessionToken) sessions.delete(req.adminSessionToken);
      return res.status(204).end();
    },
  };
}

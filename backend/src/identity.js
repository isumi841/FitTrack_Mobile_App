import { timingSafeEqual } from 'node:crypto';

export const DEVELOPMENT_OWNER = 'member3:local-development-only';
export function developmentAdminIdentity(config = {}) {
  return (req, res, next) => {
    if (!config.adminDevAuthEnabled || config.nodeEnv !== 'development' || !config.adminDevToken || config.adminDevToken === config.devAuthToken) return res.status(401).json({ error: 'Admin authentication is disabled.' });
    const supplied = Buffer.from(req.get('Authorization') ?? '');
    const expected = Buffer.from(`Bearer ${config.adminDevToken}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return res.status(403).json({ error: 'Admin access required.' });
    req.adminId = 'local-development-admin';
    next();
  };
}
// Replace this boundary with middleware verifying the team's actual access tokens.
export function developmentIdentity(config = {}) {
  return (req, res, next) => {
    if (!config.devAuthEnabled || config.nodeEnv !== 'development') return res.status(401).json({ error: 'Authentication required. Local development identity is disabled.' });
    const supplied = Buffer.from(req.get('Authorization') ?? '');
    const expected = Buffer.from(`Bearer ${config.devAuthToken}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return res.status(401).json({ error: 'A valid development bearer token is required.' });
    req.ownerId = DEVELOPMENT_OWNER;
    next();
  };
}

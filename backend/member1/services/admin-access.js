async function findAdminAccount({ User, Admin }, claims) {
  const admin = await Admin.findOne({ _id: claims.sub });
  if (admin) return admin.role === 'admin' && claims.provider === 'local' ? admin : null;
  const user = await User.findOne({ _id: claims.sub });
  return user && user.role === 'admin' && user.isEmailVerified &&
    (user.authProvider || 'local') === claims.provider ? user : null;
}

function createAdminIdentity({ sessions, User, Admin }) {
  return async (req, res, next) => {
    let claims;
    try {
      const authorization = req.get('Authorization') || '';
      if (!/^Bearer \S+$/.test(authorization)) throw new Error();
      claims = await sessions.verify(authorization.slice(7));
      if (!/^[a-f\d]{24}$/i.test(claims.sub)) throw new Error();
    } catch { return res.status(401).json({ error: 'Please log in again.' }); }
    if (claims.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    const account = await findAdminAccount({ User, Admin }, claims);
    if (!account) return res.status(401).json({ error: 'Admin access is no longer available. Please log in again.' });
    req.adminId = `admin:${account._id}`;
    req.adminAccountId = String(account._id);
    next();
  };
}
module.exports = { createAdminIdentity, findAdminAccount };

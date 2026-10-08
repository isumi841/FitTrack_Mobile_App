// Adapted from Member 1's user management API to use the shared connection and guard.
const express = require('express');
const { normalizeEmail, getPasswordValidationError } = require('../utils/validation');
function fail(status, message) { return Object.assign(new Error(message), { status, expose: true }); }
function publicUser(user) {
  return { id: String(user._id), email: user.email || null, displayName: user.displayName || null,
    role: user.role || 'user', isEmailVerified: user.isEmailVerified === true,
    authProvider: user.authProvider || 'local', createdAt: user.createdAt };
}
function validate(body, creating) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail(400, 'Enter user details.');
  const allowed = creating ? ['email', 'password', 'displayName', 'role', 'isEmailVerified'] : ['password', 'displayName', 'role', 'isEmailVerified'];
  if (Object.keys(body).some(key => !allowed.includes(key))) throw fail(400, 'Unsupported user field.');
  const result = {};
  if (creating) {
    result.email = normalizeEmail(body.email);
    if (!result.email) throw fail(400, 'Enter a valid email address.');
  }
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || body.displayName.trim().length > 200) throw fail(400, 'Name must be at most 200 characters.');
    result.displayName = body.displayName.trim() || null;
  }
  if (body.role !== undefined) {
    if (!['user', 'admin'].includes(body.role)) throw fail(400, 'Choose a valid role.');
    result.role = body.role;
  }
  if (body.isEmailVerified !== undefined) {
    if (typeof body.isEmailVerified !== 'boolean') throw fail(400, 'Choose a valid verification status.');
    result.isEmailVerified = body.isEmailVerified;
  }
  if (creating || (body.password !== undefined && body.password !== '')) {
    const error = getPasswordValidationError(body.password);
    if (error) throw fail(400, error);
  }
  return result;
}
function createUsersRouter({ User, Admin, requireAdmin, bcrypt = require('bcrypt') }) {
  if (typeof requireAdmin !== 'function') throw new Error('An admin guard is required.');
  const router = express.Router();
  router.use(requireAdmin);
  router.param('id', (req, _res, next, id) => {
    if (!/^[a-f\d]{24}$/i.test(id)) return next(fail(400, 'Invalid user ID.'));
    next();
  });
  router.get('/', async (_req, res) => {
    const users = await User.find({}).select('email displayName authProvider isEmailVerified role createdAt').sort({ createdAt: -1 });
    res.json({ success: true, users: users.map(publicUser) });
  });
  router.post('/', async (req, res) => {
    const data = validate(req.body, true);
    const email = new RegExp(`^${data.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (await User.findOne({ email }) || await Admin.findOne({ email: data.email })) throw fail(409, 'An account with this email already exists.');
    const user = await User.create({ ...data, passwordHash: await bcrypt.hash(req.body.password, 12), authProvider: 'local',
      role: data.role || 'user', isEmailVerified: data.isEmailVerified ?? true });
    res.status(201).json({ success: true, message: 'User created.', user: publicUser(user) });
  });
  router.put('/:id', async (req, res) => {
    const data = validate(req.body, false);
    if (req.params.id === req.adminAccountId && (data.role === 'user' || data.isEmailVerified === false)) throw fail(409, 'You cannot remove your own admin access.');
    const current = await User.findOne({ _id: req.params.id });
    if (!current) throw fail(404, 'User not found.');
    if (req.body.password) {
      if ((current.authProvider || 'local') !== 'local') throw fail(400, 'This account signs in through its social provider.');
      data.passwordHash = await bcrypt.hash(req.body.password, 12);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
    if (!user) throw fail(404, 'User not found.');
    res.json({ success: true, message: 'User updated.', user: publicUser(user) });
  });
  router.delete('/:id', async (req, res) => {
    if (req.params.id === req.adminAccountId) throw fail(409, 'You cannot delete your own admin account.');
    if (!await User.findByIdAndDelete(req.params.id)) throw fail(404, 'User not found.');
    res.json({ success: true, message: 'User deleted.' });
  });
  return router;
}
module.exports = { createUsersRouter };

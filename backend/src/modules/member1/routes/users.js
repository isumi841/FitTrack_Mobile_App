const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}

const { createSessionService } = require('../services/session');

function createUsersRouter({ config }) {
  const router = express.Router();
  const sessionService = createSessionService(config);

  // Middleware to ensure user is admin
  const requireAdmin = async (req, res, next) => {
    try {
      const authorization = req.get('authorization');
      if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/.test(authorization)) {
        throw httpError(401, 'Please log in again.');
      }
      const claims = await sessionService.verify(authorization.slice(7));
      if (claims.role !== 'admin') {
        throw httpError(403, 'Access denied. Admins only.');
      }
      next();
    } catch (error) {
      next(error);
    }
  };

  router.get('/', requireAdmin, async (req, res, next) => {
    try {
      const users = await User.find({}).select('email displayName authProvider isEmailVerified role createdAt').sort({ createdAt: -1 });
      res.json({ success: true, users });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', requireAdmin, async (req, res, next) => {
    try {
      const { email, password, displayName, role, isEmailVerified } = req.body;
      const existing = await User.findOne({ email }).lean();
      if (existing) {
        throw httpError(409, 'User with this email already exists.');
      }
      const passwordHash = await bcrypt.hash(password || 'default123', 12);
      const user = await User.create({
        email,
        passwordHash,
        displayName: displayName || null,
        role: role || 'user',
        isEmailVerified: isEmailVerified ?? true,
      });
      res.json({ success: true, message: 'User created.', user: { _id: user._id, email: user.email, displayName: user.displayName, role: user.role, isEmailVerified: user.isEmailVerified, createdAt: user.createdAt, authProvider: user.authProvider } });
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', requireAdmin, async (req, res, next) => {
    try {
      const { displayName, role, isEmailVerified, password } = req.body;
      const updateData = { displayName, role, isEmailVerified };
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 12);
      }
      const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
      if (!user) throw httpError(404, 'User not found.');
      res.json({ success: true, message: 'User updated.', user: { _id: user._id, email: user.email, displayName: user.displayName, role: user.role, isEmailVerified: user.isEmailVerified, createdAt: user.createdAt, authProvider: user.authProvider } });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', requireAdmin, async (req, res, next) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) throw httpError(404, 'User not found.');
      res.json({ success: true, message: 'User deleted.' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createUsersRouter };

const express = require('express');
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

  return router;
}

module.exports = { createUsersRouter };

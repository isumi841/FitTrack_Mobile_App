import mongoose from 'mongoose';
import member1Session from '../modules/member1/services/session.js';

export async function devAuth(req, res, next) {
  const authorization = req.header('authorization');
  if (authorization) {
    try {
      if (!/^Bearer [^\s]+$/.test(authorization)) throw new Error('Invalid authorization');
      const sessions = member1Session.createSessionService({ jwt: { secret: process.env.JWT_SECRET } });
      const claims = await sessions.verify(authorization.slice(7));
      if (!mongoose.Types.ObjectId.isValid(claims.sub)) throw new Error('Invalid user');
      req.user = { id: claims.sub };
      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Your session is invalid or expired. Please log in again.' });
    }
  }

  const userId =
    req.header('x-user-id') ||
    process.env.DEV_USER_ID;

  if (
    !userId ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(401).json({
      success: false,
      message: 'A valid user ID is required.',
    });
  }

  req.user = {
    id: userId,
  };

  next();
}
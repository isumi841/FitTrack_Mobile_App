import mongoose from 'mongoose';

export function devAuth(req, res, next) {
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
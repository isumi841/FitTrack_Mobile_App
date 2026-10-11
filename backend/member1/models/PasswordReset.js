const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  otpHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, required: true },
  attempts: { type: Number, default: 0, min: 0 },
  otpVersion: { type: String, required: true },
  status: { type: String, enum: ['sending', 'ready'], required: true },
});
schema.index({ email: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
module.exports = mongoose.models.PasswordReset || mongoose.model('PasswordReset', schema);

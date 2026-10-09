const mongoose = require('mongoose');
const { isValidEmail, VALIDATION_MESSAGES } = require('../utils/validation');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    validate: { validator: isValidEmail, message: VALIDATION_MESSAGES.email },
  },
  otpHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, required: true, default: 0, min: 0 },
  createdAt: { type: Date, required: true, default: Date.now, immutable: true },
  lastSentAt: { type: Date, required: true },
  otpVersion: { type: String, required: true },
  status: { type: String, required: true, enum: ['sending', 'ready'], default: 'sending' },
  deliveryToken: { type: String, default: null, select: false },
});

passwordResetSchema.index({ email: 1 }, { unique: true });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.models.PasswordReset || mongoose.model('PasswordReset', passwordResetSchema);

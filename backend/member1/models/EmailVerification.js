const mongoose = require('mongoose');
const { isValidEmail, VALIDATION_MESSAGES } = require('../utils/validation');

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: { validator: isValidEmail, message: VALIDATION_MESSAGES.email },
  },
  accountType: { type: String, enum: ['user', 'admin'], default: 'user' },
  passwordHash: { type: String, required: true, select: false },
  otpHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, required: true, default: 0, min: 0 },
  createdAt: { type: Date, required: true, default: Date.now, immutable: true },
  lastSentAt: { type: Date, required: true },
  // These fields let routes reserve delivery and invalidate older codes atomically.
  otpVersion: { type: String, required: true },
  status: { type: String, required: true, enum: ['sending', 'ready'], default: 'sending' },
  deliveryToken: { type: String, default: null, select: false },
}, {
  toJSON: {
    transform(_document, result) {
      delete result.passwordHash;
      delete result.otpHash;
      delete result.deliveryToken;
      return result;
    },
  },
});

// Keep expired requests for one day so the user can resend without entering
// their password again. Routes check expiresAt directly; TTL cleanup is delayed.
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.models.EmailVerification ||
  mongoose.model('EmailVerification', emailVerificationSchema);

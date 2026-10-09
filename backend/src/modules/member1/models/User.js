const mongoose = require('mongoose');
const { isValidEmail, normalizeEmail, VALIDATION_MESSAGES } = require('../utils/validation');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required() { return this.authProvider === 'local'; },
    set(value) {
      return value == null ? undefined : normalizeEmail(value);
    },
    validate: {
      validator(value) {
        return this.authProvider === 'local' ? isValidEmail(value) : value == null || isValidEmail(value);
      },
      message: VALIDATION_MESSAGES.email,
    },
  },
  authProvider: { type: String, required: true, enum: ['local', 'google', 'apple', 'facebook'], default: 'local' },
  providerUserId: {
    type: String,
    required() { return this.authProvider !== 'local'; },
    maxlength: 255,
  },
  displayName: { type: String, maxlength: 200, default: null },
  passwordHash: { type: String, required() { return this.authProvider === 'local'; }, select: false },
  isEmailVerified: { type: Boolean, required: true, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, required: true, default: Date.now, immutable: true },
}, {
  toJSON: {
    transform(_document, result) {
      delete result.passwordHash;
      return result;
    },
  },
});

// Missing email is supported for Apple/Facebook. Provider subject, never email,
// is the stable social identity. The email index prevents automatic linking.
userSchema.index({ email: 1 }, {
  name: 'auth_email_unique', unique: true, partialFilterExpression: { email: { $type: 'string' } },
});
userSchema.index({ authProvider: 1, providerUserId: 1 }, {
  name: 'auth_provider_subject_unique', unique: true,
  partialFilterExpression: { providerUserId: { $type: 'string' } },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

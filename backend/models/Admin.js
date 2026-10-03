const mongoose = require('mongoose');
const { isValidEmail, normalizeEmail, VALIDATION_MESSAGES } = require('../utils/validation');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    set(value) {
      return value == null ? undefined : normalizeEmail(value);
    },
    validate: {
      validator(value) {
        return isValidEmail(value);
      },
      message: VALIDATION_MESSAGES.email,
    },
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    required: true,
    enum: ['admin'],
    default: 'admin',
  },
  displayName: {
    type: String,
    maxlength: 200,
    default: 'System Admin',
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true,
  },
}, {
  toJSON: {
    transform(_document, result) {
      delete result.passwordHash;
      return result;
    },
  },
});

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  provider: { type: String, required: true, enum: ['google', 'facebook'] },
  codeHash: { type: String, required: true, unique: true, select: false },
  redirectUri: { type: String, required: true },
  codeChallenge: { type: String, required: true },
  identity: {
    providerUserId: { type: String, required: true },
    email: { type: String, default: null },
    isEmailVerified: { type: Boolean, required: true },
    displayName: { type: String, default: null },
  },
  expiresAt: { type: Date, required: true },
}, {
  toJSON: {
    transform(_document, result) {
      delete result.codeHash;
      return result;
    },
  },
});

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.SocialOAuthHandoff || mongoose.model('SocialOAuthHandoff', schema);

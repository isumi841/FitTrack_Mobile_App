const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  provider: { type: String, required: true, enum: ['google', 'facebook'] },
  providerStateHash: { type: String, required: true, unique: true, select: false },
  appState: { type: String, required: true },
  redirectUri: { type: String, required: true },
  codeChallenge: { type: String, required: true },
  // Google PKCE verifier exists only during this short authorization request.
  // Provider ID/access tokens are never persisted.
  providerCodeVerifier: { type: String, default: null, select: false },
  providerNonceHash: { type: String, default: null, select: false },
  expiresAt: { type: Date, required: true },
}, {
  toJSON: {
    transform(_document, result) {
      delete result.providerStateHash;
      delete result.providerCodeVerifier;
      delete result.providerNonceHash;
      return result;
    },
  },
});

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.SocialOAuthRequest || mongoose.model('SocialOAuthRequest', schema);

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  challengeId: { type: String, required: true, unique: true },
  provider: { type: String, required: true, enum: ['google', 'apple'] },
  nonceHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.SocialAuthChallenge || mongoose.model('SocialAuthChallenge', schema);

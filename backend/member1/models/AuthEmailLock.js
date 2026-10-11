const mongoose = require('mongoose');

// User and pending verification live in separate collections. This short lease
// serializes their competing email claims without holding a transaction over SMTP.
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  token: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.AuthEmailLock || mongoose.model('AuthEmailLock', schema);

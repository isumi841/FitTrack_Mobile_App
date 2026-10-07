const path = require('node:path');
const dns = require('node:dns');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { loadConfig } = require('./config');
const User = require('./models/User');
const EmailVerification = require('./models/EmailVerification');
const SocialAuthChallenge = require('./models/SocialAuthChallenge');
const AuthEmailLock = require('./models/AuthEmailLock');
const SocialOAuthRequest = require('./models/SocialOAuthRequest');
const SocialOAuthHandoff = require('./models/SocialOAuthHandoff');
const { createEmailService } = require('./services/email');
const { createAuthRouter } = require('./routes/auth');
const { createAuthRateLimiter } = require('./middleware/auth-rate-limit');
const backendDirectory = path.dirname(require.resolve('./package.json'));

dns.setServers(['8.8.8.8', '1.1.1.1']);

function createApp({ config, authRouter, rateLimiter = createAuthRateLimiter() }) {
  const app = express();
  app.disable('x-powered-by');
  // Leave trust proxy disabled unless a deployment explicitly trusts its proxy.
  app.use(cors({
    origin(origin, callback) {
      // Native apps and command-line clients do not send a browser Origin.
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      const error = new Error('This browser origin is not allowed.');
      error.status = 403;
      error.expose = true;
      callback(error);
    },
  }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'FitTrack authentication API is running.' });
  });

  app.use('/api/auth', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  }, rateLimiter, authRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found.' });
  });

  // Never expose database/SMTP errors, request bodies, password hashes or OTPs.
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ success: false, message: 'Request body must contain valid JSON.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ success: false, message: 'Request body is too large.' });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This email is registered or a verification request is already in progress.' });
    }
    const safeStatus = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599;
    if (error.expose === true && safeStatus) {
      const payload = { success: false, message: error.message };
      if (error.status === 429 && Number.isInteger(error.retryAfterSeconds) && error.retryAfterSeconds > 0) {
        res.setHeader('Retry-After', error.retryAfterSeconds);
        payload.retryAfterSeconds = error.retryAfterSeconds;
      }
      return res.status(error.status).json(payload);
    }
    res.status(500).json({ success: false, message: 'Unable to process your request. Please try again.' });
  });

  return app;
}

async function startServer() {
  // Resolve .env from the backend folder even if launched from the repo root.
  dotenv.config({ path: path.join(backendDirectory, '.env'), quiet: true });
  const config = loadConfig();
  mongoose.connection.on('error', (error) => {
    // Raw database messages may contain connection strings or credentials.
    console.error('MongoDB connection error name:', error?.name);
  });
  await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 10000 });
const Admin = require('./models/Admin');
const { seedAdmin } = require('./scripts/seed-admin');

  // Create replacement uniqueness protection before removing the legacy full
  // email index, which treated two Apple/Facebook accounts without email as duplicates.
  await Promise.all([User.init(), Admin.init(), EmailVerification.init(), SocialAuthChallenge.init(),
    AuthEmailLock.init(), SocialOAuthRequest.init(), SocialOAuthHandoff.init()]);
  const userIndexes = await User.collection.indexes();
  const replacement = userIndexes.find((index) => index.name === 'auth_email_unique' && index.unique && index.partialFilterExpression);
  const legacy = userIndexes.find((index) => index.name === 'email_1' && index.unique && !index.partialFilterExpression);
  if (replacement && legacy) await User.collection.dropIndex(legacy.name);

  const { sendVerificationEmail } = createEmailService(config);
  const authRouter = createAuthRouter({ User, EmailVerification, bcrypt, sendVerificationEmail, config });
  const app = createApp({ config, authRouter });
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(config.port, () => resolve(listener));
    listener.once('error', reject);
  });

  console.log(`FitTrack authentication API listening on port ${config.port}.`);
  const shutdown = () => {
    server.close(async () => {
      await mongoose.disconnect();
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return { app, server };
}

if (require.main === module) {
  startServer().catch(async (error) => {
    // No raw connection error: it may contain database/email credentials.
    console.error('Backend startup failed. Check backend/.env, MongoDB Atlas access, and your configured port.');
    
    console.error('Startup error name:', error?.name);
    console.error('Startup error message:', error?.message);
    console.error('Startup error reason:', error?.reason?.type);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}

module.exports = { createApp, startServer };

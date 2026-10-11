const express = require('express');
const cors = require('cors');
const { createAuthRateLimiter } = require('./middleware/auth-rate-limit');

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

module.exports = { createApp };

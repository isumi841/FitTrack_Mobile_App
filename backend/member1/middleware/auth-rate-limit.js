// A small per-process limiter. OTP attempts and resend cooldowns are also
// enforced in MongoDB, so concurrent requests cannot bypass those limits.
function createAuthRateLimiter({
  maxRequests = 30,
  windowMs = 15 * 60 * 1000,
  now = Date.now,
} = {}) {
  const requests = new Map();
  let lastCleanup = 0;

  return function authRateLimiter(req, res, next) {
    const time = now();
    if (time - lastCleanup >= 60000) {
      for (const [ip, entry] of requests) {
        if (entry.resetAt <= time) requests.delete(ip);
      }
      lastCleanup = time;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = requests.get(ip);
    if (!entry || entry.resetAt <= time) {
      // Bound memory even when many addresses contact the server.
      if (!entry && requests.size >= 10000) {
        return res.status(429).json({ success: false, message: 'Too many authentication requests. Try again later.' });
      }
      entry = { count: 0, resetAt: time + windowMs };
      requests.set(ip, entry);
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil((entry.resetAt - time) / 1000)));
      return res.status(429).json({ success: false, message: 'Too many authentication requests. Try again later.' });
    }
    next();
  };
}

module.exports = { createAuthRateLimiter };

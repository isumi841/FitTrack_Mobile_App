function requiredValue(env, key) {
  const value = env[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function positiveInteger(env, key, fallback, maximum) {
  const raw = env[key];
  const value = raw === undefined || raw === '' ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${key} must be an integer between 1 and ${maximum}.`);
  }
  return value;
}

function values(env, key) {
  return (env[key] || '').split(',').map((value) => value.trim()).filter(Boolean);
}

function loadConfig(env = process.env) {
  const mongodbUri = requiredValue(env, 'MONGODB_URI').trim();
  if (!/^mongodb(?:\+srv)?:\/\//.test(mongodbUri)) {
    throw new Error('MONGODB_URI must be a MongoDB connection URI.');
  }

  const production = env.NODE_ENV === 'production';
  // Existing deployments keep SMTP unless development delivery is explicit.
  const emailMode = env.EMAIL_MODE ?? 'smtp';
  if (!['development', 'smtp'].includes(emailMode)) {
    throw new Error('EMAIL_MODE must be development or smtp.');
  }
  if (production && emailMode === 'development') {
    throw new Error('EMAIL_MODE=development is not allowed when NODE_ENV=production. Use EMAIL_MODE=smtp.');
  }
  const defaultOrigins =
    'http://localhost:8081,http://localhost:19006,http://localhost:3000';
  const rawOrigins = production
    ? requiredValue(env, 'CORS_ORIGINS')
    : env.CORS_ORIGINS || defaultOrigins;
  const corsOrigins = rawOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!corsOrigins.length) {
    throw new Error('CORS_ORIGINS must contain at least one browser origin.');
  }
  for (const origin of corsOrigins) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error('CORS_ORIGINS must contain valid HTTP or HTTPS origins.');
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error('CORS_ORIGINS must contain HTTP or HTTPS origins without paths.');
    }
    if (production && parsed.protocol !== 'https:') {
      throw new Error('Production CORS_ORIGINS must use HTTPS.');
    }
  }

  const email = { mode: emailMode };
  if (emailMode === 'smtp') {
    Object.assign(email, {
      host: requiredValue(env, 'EMAIL_HOST').trim(),
      port: positiveInteger(env, 'EMAIL_PORT', 587, 65535),
      user: requiredValue(env, 'EMAIL_USER').trim(),
      // Preserve password characters exactly, including any intentional spaces.
      pass: requiredValue(env, 'EMAIL_PASS'),
      from: requiredValue(env, 'EMAIL_FROM').trim(),
      // This local testing opt-in is ignored in production.
      allowSelfSigned: !production && env.SMTP_ALLOW_SELF_SIGNED === 'true',
    });
  }

  const jwtSecret = requiredValue(env, 'JWT_SECRET');
  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 UTF-8 bytes of random secret material.');
  }
  const callbackBaseUrl = (env.SOCIAL_CALLBACK_BASE_URL || '').trim().replace(/\/$/, '');
  if (callbackBaseUrl) {
    let callback;
    try { callback = new URL(callbackBaseUrl); } catch {
      throw new Error('SOCIAL_CALLBACK_BASE_URL must be an HTTP(S) API origin.');
    }
    const localHttp = !production && callback.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(callback.hostname);
    if ((!localHttp && callback.protocol !== 'https:') || callback.origin !== callbackBaseUrl || callback.username || callback.password) {
      throw new Error('SOCIAL_CALLBACK_BASE_URL must be an HTTPS API origin (localhost HTTP allowed in development).');
    }
  }
  const redirectUris = values(env, 'AUTH_REDIRECT_URIS');
  for (const uri of redirectUris) {
    let redirect;
    try { redirect = new URL(uri); } catch { throw new Error('AUTH_REDIRECT_URIS must contain absolute redirect URIs.'); }
    if (redirect.username || redirect.password || redirect.hash || redirect.search ||
        ['javascript:', 'data:', 'file:'].includes(redirect.protocol) ||
        (production && redirect.protocol === 'http:')) {
      throw new Error('AUTH_REDIRECT_URIS must contain safe exact redirect URIs without query strings or fragments.');
    }
  }
  const facebookGraphVersion = (env.FACEBOOK_GRAPH_VERSION || '').trim();
  if (facebookGraphVersion && !/^v\d+\.\d+$/.test(facebookGraphVersion)) {
    throw new Error('FACEBOOK_GRAPH_VERSION must use the configured Meta API version, e.g. vXX.0.');
  }

  return {
    production,
    port: positiveInteger(env, 'PORT', 5000, 65535),
    mongodbUri,
    otpExpiryMinutes: positiveInteger(env, 'OTP_EXPIRY_MINUTES', 5, 60),
    corsOrigins,
    email,
    jwt: { secret: jwtSecret, expiryMinutes: positiveInteger(env, 'JWT_EXPIRY_MINUTES', 60, 10080) },
    oauth: {
      googleClientIds: values(env, 'GOOGLE_CLIENT_ID'),
      googleClientSecret: env.GOOGLE_CLIENT_SECRET || '',
      appleClientIds: values(env, 'APPLE_CLIENT_ID'),
      facebookAppId: (env.FACEBOOK_APP_ID || '').trim(),
      facebookAppSecret: env.FACEBOOK_APP_SECRET || '',
      facebookGraphVersion,
      callbackBaseUrl,
      redirectUris,
    },
  };
}

module.exports = { loadConfig };

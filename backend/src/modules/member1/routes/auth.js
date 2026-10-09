const express = require('express');
const { randomInt, randomUUID, randomBytes, createHash } = require('node:crypto');
const {
  isValidSliitEmail,
  isValidEmail,
  normalizeEmail,
  getPasswordValidationError,
  isPasswordWithinBcryptLimit,
  VALIDATION_MESSAGES,
} = require('../utils/validation');
const { createSessionService } = require('../services/session');
const { createSocialVerifier } = require('../services/social-verification');
const { createOAuthBroker } = require('../services/oauth-broker');

const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const BCRYPT_ROUNDS = 12;
const PENDING_SIGNUP_MESSAGE = 'A sign-up is already pending for this email. Verify it or request a new code.';
const DUPLICATE_LOCAL_MESSAGE = 'This email is already registered. Please log in instead.';
const DUPLICATE_PASSWORD_MESSAGE = 'This email is already registered. Please log in instead.';
const ORIGINAL_METHOD_MESSAGE = 'An account already exists with this email. Please log in using your original sign-in method.';
const nonceHash = (nonce) => createHash('sha256').update(nonce).digest('hex');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}

function publicUser(user) {
  return {
    id: String(user._id),
    email: user.email ?? null,
    isEmailVerified: user.isEmailVerified === true,
    authProvider: user.authProvider || 'local',
    displayName: user.displayName || null,
    role: user.role || 'user',
  };
}

function publicAdmin(admin) {
  return {
    id: String(admin._id),
    email: admin.email,
    role: 'admin',
    isEmailVerified: true,
    authProvider: 'local',
    displayName: admin.displayName || 'System Admin',
  };
}

function requireValidEmail(email) {
  if (!isValidEmail(email)) throw httpError(400, VALIDATION_MESSAGES.email);
  return normalizeEmail(email);
}

function requirePersonalEmail(email) {
  if (!isValidEmail(email)) throw httpError(400, VALIDATION_MESSAGES.email);
  return normalizeEmail(email);
}

function pendingError(pending, currentTime) {
  if (!pending) return httpError(404, 'No pending sign-up was found. Please sign up again.');
  if (new Date(pending.expiresAt).getTime() <= currentTime.getTime()) {
    return httpError(410, 'This verification code has expired.');
  }
  if (pending.status !== 'ready') {
    return httpError(409, 'Your verification email is being sent. Please wait and try again.');
  }
  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    return httpError(429, 'Too many verification attempts. Please request a new code.');
  }
  return httpError(409, 'Verification changed. Please try again with the latest code.');
}

/** Dependencies can be injected into real HTTP tests without sending mail. */
function createAuthRouter({
  User = require('../models/User'),
  Admin = require('../models/Admin'),
  EmailVerification = require('../models/EmailVerification'),
  SocialAuthChallenge = require('../models/SocialAuthChallenge'),
  PasswordReset = require('../models/PasswordReset'),
  AuthEmailLock = require('../models/AuthEmailLock'),
  bcrypt = require('bcrypt'),
  sendVerificationEmail,
  config = { otpExpiryMinutes: 5 },
  startSession = () => User.db.startSession(),
  now = () => new Date(),
  sessionService,
  socialVerifier,
  oauthBroker,
} = {}) {
  if (typeof sendVerificationEmail !== 'function') {
    throw new Error('A verification email service is required.');
  }

  const router = express.Router();
  const otpExpiryMinutes = config.otpExpiryMinutes ?? 5;
  const currentTime = () => new Date(now());
  const sessions = sessionService || createSessionService(config, { now });
  const verifier = socialVerifier || createSocialVerifier(config, { now });
  const broker = oauthBroker || createOAuthBroker({ config, verifier, now });
  broker.registerRoutes(router);

  async function withEmailLock(email, work) {
    const token = randomUUID();
    const checkedAt = currentTime();
    try {
      await AuthEmailLock.findOneAndUpdate({ email, expiresAt: { $lte: checkedAt } }, {
        $set: { email, token, expiresAt: new Date(checkedAt.getTime() + 5 * 60 * 1000) },
      }, { upsert: true, returnDocument: 'after', runValidators: true });
    } catch (error) {
      if (error.code === 11000) throw httpError(409, 'A sign-in or sign-up for this email is in progress. Please try again.');
      throw error;
    }
    try { return await work(); } finally { await AuthEmailLock.deleteOne({ email, token }); }
  }

  async function requireUnregisteredEmail(email) {
    if (await User.exists({ email })) {
      throw httpError(409, DUPLICATE_LOCAL_MESSAGE);
    }
  }

  /**
   * Reserve a new code before SMTP delivery. Neither old nor new codes can be
   * verified while sending. Only this delivery token may promote or roll back
   * the reservation, so a late response cannot overwrite a newer challenge.
   */
  async function sendCode(email, newPasswordHash, accountType = 'user') {
    const previous = await EmailVerification.findOne({ email })
      .select('+passwordHash +otpHash +deliveryToken +accountType').lean();
    const checkedAt = currentTime();

    if (previous && newPasswordHash) {
      throw httpError(409, PENDING_SIGNUP_MESSAGE);
    }
    if (!previous && !newPasswordHash) {
      throw httpError(404, 'No pending sign-up was found. Please sign up again.');
    }
    const recoverExpiredDelivery = previous?.status === 'sending' &&
      new Date(previous.expiresAt).getTime() <= checkedAt.getTime();
    if (previous && previous.status !== 'ready' && !recoverExpiredDelivery) {
      throw httpError(409, 'Your verification email is being sent. Please wait and try again.');
    }
    if (previous && checkedAt.getTime() - new Date(previous.lastSentAt).getTime() < RESEND_COOLDOWN_MS) {
      const error = httpError(429, 'Please wait 60 seconds before requesting another verification code.');
      error.retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - checkedAt.getTime() + new Date(previous.lastSentAt).getTime()) / 1000);
      throw error;
    }

    const otp = String(randomInt(1000, 10000));
    const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
    const sentAt = currentTime();
    const deliveryToken = randomUUID();
    const values = {
      accountType: accountType ?? previous?.accountType ?? 'user',
      passwordHash: newPasswordHash ?? previous.passwordHash,
      otpHash,
      expiresAt: new Date(sentAt.getTime() + otpExpiryMinutes * 60 * 1000),
      lastSentAt: sentAt,
      attempts: 0,
      otpVersion: randomUUID(),
      status: 'sending',
      deliveryToken,
    };

    let pending;
    let rollback;
    if (previous) {
      // Return the actual previous values atomically, including any attempt
      // reserved after our initial read, so SMTP failure does not reset them.
      const reservationFilter = {
        _id: previous._id,
        otpVersion: previous.otpVersion,
        status: previous.status,
        lastSentAt: { $lte: new Date(sentAt.getTime() - RESEND_COOLDOWN_MS) },
      };
      if (recoverExpiredDelivery) {
        // Recover only after the old code expires. SMTP has bounded timeouts;
        // the old token/version cannot promote or roll back this replacement.
        reservationFilter.expiresAt = { $lte: sentAt };
        reservationFilter.deliveryToken = previous.deliveryToken;
      }
      rollback = await EmailVerification.findOneAndUpdate(reservationFilter,
        { $set: values }, { returnDocument: 'before', runValidators: true })
        .select('+passwordHash +otpHash +deliveryToken').lean();

      if (!rollback) {
        throw httpError(409, 'Verification changed. Please wait and request a code again.');
      }
      pending = { _id: previous._id };
    } else {
      try {
        pending = await EmailVerification.create({ email, ...values });
      } catch (error) {
        if (error.code === 11000) {
          throw httpError(409, PENDING_SIGNUP_MESSAGE);
        }
        throw error;
      }
    }

    const deliveryFilter = { _id: pending._id, status: 'sending', deliveryToken };

    // A verification may have completed between the first user lookup and a
    // new pending insert. Never email another sign-up code for that account.
    if (await User.exists({ email })) {
      await EmailVerification.deleteOne(deliveryFilter);
      throw httpError(409, DUPLICATE_LOCAL_MESSAGE);
    }

    try {
      await sendVerificationEmail({ email, otp, expiresInMinutes: otpExpiryMinutes });
    } catch {
      if (rollback) {
        await EmailVerification.updateOne(deliveryFilter, { $set: {
          passwordHash: rollback.passwordHash,
          otpHash: rollback.otpHash,
          expiresAt: rollback.expiresAt,
          lastSentAt: rollback.lastSentAt,
          attempts: rollback.attempts,
          otpVersion: rollback.otpVersion,
          status: rollback.status,
          deliveryToken: rollback.deliveryToken ?? null,
        } });
      } else {
        await EmailVerification.deleteOne(deliveryFilter);
      }
      throw httpError(503, 'Unable to send the verification email. Please try again.');
    }

    const delivered = await EmailVerification.updateOne(deliveryFilter, {
      $set: { status: 'ready', deliveryToken: null },
    });
    if (delivered.modifiedCount !== 1) {
      throw httpError(409, 'Verification changed. Please request a new code.');
    }
  }

  async function createPersonalAccount(email, password) {
    const createUser = async () => {
      if (await User.exists({ email })) throw httpError(409, DUPLICATE_PASSWORD_MESSAGE);
      if (await EmailVerification.findOne({ email }).select('_id').lean()) {
        throw httpError(409, ORIGINAL_METHOD_MESSAGE);
      }
      try {
        const created = await User.create([{
          email,
          passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
          isEmailVerified: true,
          authProvider: 'local',
        }]);
        return created[0];
      } catch (error) {
        if (error.code === 11000) throw httpError(409, DUPLICATE_PASSWORD_MESSAGE);
        throw error;
      }
    };
    return withEmailLock(email, createUser);
  }

  router.post('/signup', async (req, res) => {
    const { password, confirmPassword } = req.body ?? {};
    const email = requirePersonalEmail(req.body?.email);
    const passwordError = getPasswordValidationError(password);
    if (passwordError) throw httpError(400, passwordError);
    if (typeof confirmPassword !== 'string' || confirmPassword !== password) {
      throw httpError(400, VALIDATION_MESSAGES.confirmPassword);
    }

    const accountType = 'user';
    await requireUnregisteredEmail(email);

    if (await EmailVerification.findOne({ email }).select('_id').lean()) {
      throw httpError(409, PENDING_SIGNUP_MESSAGE);
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await withEmailLock(email, () => sendCode(email, passwordHash, accountType));
    res.status(201).json({
      success: true,
      message: 'Verification code sent. Check your email.',
      email,
    });
  });

  router.post('/resend-otp', async (req, res) => {
    const email = requireValidEmail(req.body?.email);
    await requireUnregisteredEmail(email);
    await sendCode(email);
    res.json({ success: true, message: 'A new verification code was sent.', email });
  });

  router.post('/verify-email', async (req, res) => {
    const { otp } = req.body ?? {};
    const email = requireValidEmail(req.body?.email);
    if (typeof otp !== 'string' || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      throw httpError(400, 'Enter the 4-digit verification code from your email.');
    }

    // Reserve every guess before bcrypt comparison. Parallel requests cannot
    // all observe attempts=0 and bypass the five-attempt budget.
    const pending = await EmailVerification.findOneAndUpdate({
      email,
      status: 'ready',
      expiresAt: { $gt: currentTime() },
      attempts: { $lt: MAX_OTP_ATTEMPTS },
    }, { $inc: { attempts: 1 } }, { returnDocument: 'after' })
      .select('+passwordHash +otpHash').lean();

    if (!pending) {
      const latest = await EmailVerification.findOne({ email }).select('expiresAt attempts status').lean();
      throw pendingError(latest, currentTime());
    }
    if (!await bcrypt.compare(otp, pending.otpHash)) {
      if (pending.attempts >= MAX_OTP_ATTEMPTS) {
        throw httpError(429, 'Too many verification attempts. Please request a new code.');
      }
      throw httpError(400, 'Invalid verification code. Please try again.');
    }

    const session = await startSession();
    let createdAccount;
    let isAdminAccount = pending.accountType === 'admin';
    try {
      await session.withTransaction(async () => {
        const consumed = await EmailVerification.deleteOne({
          _id: pending._id,
          otpVersion: pending.otpVersion,
          otpHash: pending.otpHash,
          status: 'ready',
          expiresAt: { $gt: currentTime() },
        }, { session });
        if (consumed.deletedCount !== 1) {
          throw httpError(409, 'Verification code expired or changed. Please use the latest code.');
        }

        if (isAdminAccount) {
          const created = await Admin.create([{
            email: pending.email,
            passwordHash: pending.passwordHash,
            role: 'admin',
            displayName: 'System Administrator',
          }], { session });
          createdAccount = created[0];
        } else {
          const created = await User.create([{
            email: pending.email,
            passwordHash: pending.passwordHash,
            isEmailVerified: true,
            authProvider: 'local',
          }], { session });
          createdAccount = created[0];
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        throw httpError(409, isAdminAccount ? 'This admin email is already registered. Please log in instead.' : DUPLICATE_LOCAL_MESSAGE);
      }
      throw error;
    } finally {
      await session.endSession();
    }

    res.status(201).json({
      success: true,
      message: isAdminAccount ? 'Your email is verified. Your admin account is ready.' : 'Your email is verified. Your account is ready.',
      user: isAdminAccount ? publicAdmin(createdAccount) : publicUser(createdAccount),
    });
  });

  router.post('/login', async (req, res) => {
    const { password } = req.body ?? {};
    const email = requirePersonalEmail(req.body?.email);
    if (typeof password !== 'string' || !password.length) {
      throw httpError(400, 'Enter your password.');
    }
    if (!isPasswordWithinBcryptLimit(password)) {
      throw httpError(401, 'Incorrect email or password.');
    }

    // 1. Check Admin Collection
    const admin = await Admin.findOne({ email }).select('+passwordHash email role displayName');
    if (admin) {
      if (!admin.passwordHash || !await bcrypt.compare(password, admin.passwordHash)) {
        throw httpError(401, 'Incorrect email or password.');
      }
      return res.json({
        success: true,
        message: 'Admin login successful.',
        user: publicAdmin(admin),
        session: await sessions.issue(admin),
      });
    }

    // 2. Check User Collection
    const user = await User.findOne({ email }).select('+passwordHash email isEmailVerified authProvider displayName role');
    if (user) {
      if (!user.isEmailVerified) {
        throw httpError(403, 'Please verify your email before logging in.');
      }
      if ((user.authProvider && user.authProvider !== 'local') || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
        throw httpError(401, 'Incorrect email or password.');
      }
      return res.json({
        success: true,
        message: 'Login successful.',
        user: publicUser(user),
        session: await sessions.issue(user),
      });
    }

    if (await EmailVerification.findOne({ email }).select('_id').lean()) {
      throw httpError(403, 'Please verify your email before logging in.');
    }
    throw httpError(404, 'Account not found. Please sign up first.');
  });

  router.post('/admin/signup', async (req, res) => {
    const { password } = req.body ?? {};
    const email = requirePersonalEmail(req.body?.email);
    if (typeof password !== 'string' || !password.length) {
      throw httpError(400, 'Enter a password.');
    }
    if (!isPasswordWithinBcryptLimit(password)) {
      throw httpError(400, 'Password is too long.');
    }

    const existing = await Admin.findOne({ email }).lean();
    if (existing) {
      throw httpError(409, 'An admin account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const admin = await Admin.create({
      email,
      passwordHash,
      role: 'admin',
      displayName: 'System Admin',
    });

    res.json({ success: true, message: 'Admin account created.', user: publicAdmin(admin), session: await sessions.issue(admin) });
  });

  router.post('/forgot-password', async (req, res) => {
    const email = requirePersonalEmail(req.body?.email);
    const user = await User.findOne({ email }).select('_id authProvider').lean();
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a reset code was sent.' });
    }
    if (user.authProvider && user.authProvider !== 'local') {
      throw httpError(400, 'This account uses a social login provider. Please log in using your provider.');
    }

    const currentTime = new Date();
    const existing = await PasswordReset.findOne({ email }).select('lastSentAt status').lean();
    if (existing && existing.status !== 'ready' && existing.lastSentAt.getTime() + 60000 > currentTime.getTime()) {
      throw httpError(429, 'Please wait before requesting another code.');
    }

    const otpString = String(randomInt(1000, 10000));
    const otpHash = await bcrypt.hash(otpString, BCRYPT_ROUNDS);
    const expiresAt = new Date(currentTime.getTime() + 15 * 60 * 1000);
    const deliveryToken = randomUUID();
    const otpVersion = randomUUID();

    await PasswordReset.findOneAndUpdate(
      { email },
      { $set: { otpHash, expiresAt, attempts: 0, lastSentAt: currentTime, status: 'sending', deliveryToken, otpVersion } },
      { upsert: true, new: true }
    );

    // Send email asynchronously
    Promise.resolve().then(async () => {
      try {
        await sendVerificationEmail({ email, otp: otpString, expiresInMinutes: 15 });
        await PasswordReset.updateOne({ email, deliveryToken }, { $set: { status: 'ready' }, $unset: { deliveryToken: 1 } });
      } catch (error) {
        console.error('[auth] Failed to send password reset email:', error);
        await PasswordReset.updateOne({ email, deliveryToken }, { $set: { status: 'failed' } });
      }
    });

    res.json({ success: true, message: 'Password reset code sent.', expiresAt });
  });

  router.post('/reset-password', async (req, res) => {
    const email = requirePersonalEmail(req.body?.email);
    const { code, password } = req.body ?? {};

    if (typeof code !== 'string' || code.trim().length !== 4) {
      throw httpError(400, `Enter the 4-digit code from your email.`);
    }
    if (typeof password !== 'string' || !password.length) {
      throw httpError(400, 'Enter a new password.');
    }
    if (!isPasswordWithinBcryptLimit(password)) {
      throw httpError(400, 'Password is too long.');
    }

    const currentTime = new Date();
    const pending = await PasswordReset.findOne({ email }).select('+otpHash attempts expiresAt status otpVersion').lean();
    if (pendingError(pending, currentTime)) throw pendingError(pending, currentTime);

    if (!await bcrypt.compare(code, pending.otpHash)) {
      await PasswordReset.updateOne({ email, otpVersion: pending.otpVersion }, { $inc: { attempts: 1 } });
      throw httpError(401, 'Incorrect verification code.');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await User.updateOne({ email }, { $set: { passwordHash } });
    await PasswordReset.deleteOne({ email, otpVersion: pending.otpVersion });

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  });

  router.post('/admin/login', async (req, res) => {
    const { password } = req.body ?? {};
    const email = requirePersonalEmail(req.body?.email);
    if (typeof password !== 'string' || !password.length) {
      throw httpError(400, 'Enter your password.');
    }
    if (!isPasswordWithinBcryptLimit(password)) {
      throw httpError(401, 'Incorrect email or password.');
    }

    const admin = await Admin.findOne({ email }).select('+passwordHash email role displayName');
    if (!admin || !admin.passwordHash || !await bcrypt.compare(password, admin.passwordHash)) {
      throw httpError(401, 'Incorrect email or password.');
    }

    res.json({ success: true, message: 'Admin login successful.', user: publicAdmin(admin), session: await sessions.issue(admin) });
  });

  async function readValidSession(accessToken) {
    if (typeof accessToken !== 'string' || !accessToken || /\s/.test(accessToken)) {
      throw httpError(401, 'Please log in again.');
    }
    let claims;
    try { claims = await sessions.verify(accessToken); } catch {
      throw httpError(401, 'Your session has expired or is invalid. Please log in again.');
    }
    let user;
    if (claims.role === 'admin') {
      const admin = await Admin.findOne({ _id: claims.sub });
      const userAdmin = admin ? null : await User.findOne({ _id: claims.sub, role: 'admin' });
      if (!admin && !userAdmin) throw httpError(401, 'Please log in again.');
      user = admin ? publicAdmin(admin) : publicUser(userAdmin);
    } else {
      const account = await User.findOne({ _id: claims.sub });
      if (!account || (account.authProvider || 'local') !== claims.provider ||
          ((account.authProvider || 'local') === 'local' && !account.isEmailVerified)) {
        throw httpError(401, 'Please log in again.');
      }
      user = publicUser(account);
    }
    return { success: true, message: 'Session is valid.', user,
      session: { accessToken, expiresAt: new Date(claims.exp * 1000).toISOString() } };
  }

  function bearerToken(req) {
    const authorization = req.get('authorization');
    return typeof authorization === 'string' && /^Bearer [^\s]+$/.test(authorization)
      ? authorization.slice(7) : undefined;
  }

  router.get('/me', async (req, res) => {
    const { session, ...result } = await readValidSession(bearerToken(req));
    res.json(result);
  });

  const cookieName = 'fittrack_session';
  const cookieOptions = {
    httpOnly: true, secure: config.production === true, sameSite: 'lax', path: '/api/auth/session',
  };
  // This non-simple header forces a CORS preflight for cross-origin browser requests.
  // The app's existing origin allowlist rejects untrusted sites before this router.
  router.use('/session', (req, _res, next) => {
    if (req.get('x-fittrack-session') !== '1') {
      throw httpError(403, 'Invalid browser session request.');
    }
    next();
  });
  router.post('/session', async (req, res) => {
    const result = await readValidSession(bearerToken(req));
    // Keep the server-issued expiry; reopening must not extend a JWT's lifetime.
    res.cookie(cookieName, result.session.accessToken, {
      ...cookieOptions, expires: new Date(result.session.expiresAt),
    });
    res.json({ success: true, message: 'Sign-in saved.' });
  });
  router.get('/session', async (req, res) => {
    const entry = (req.get('cookie') || '').split(';').map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`));
    let token;
    try { token = entry && decodeURIComponent(entry.slice(cookieName.length + 1)); } catch { /* Invalid cookie. */ }
    try {
      res.json(await readValidSession(token));
    } catch (error) {
      if (error.status === 401) res.clearCookie(cookieName, cookieOptions);
      throw error;
    }
  });
  router.delete('/session', (_req, res) => {
    res.clearCookie(cookieName, cookieOptions);
    res.json({ success: true, message: 'Signed out.' });
  });

  router.post('/social/challenge', async (req, res) => {
    const provider = req.body?.provider;
    if (!['google', 'apple'].includes(provider)) throw httpError(400, 'Choose a supported identity provider.');
    const configured = provider === 'google' ? config.oauth?.googleClientIds : config.oauth?.appleClientIds;
    if (!configured?.length) throw httpError(503, `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not configured yet.`);
    const challengeId = randomUUID();
    const nonce = randomBytes(32).toString('base64url');
    await SocialAuthChallenge.create({
      challengeId, provider, nonceHash: nonceHash(nonce), expiresAt: new Date(currentTime().getTime() + 5 * 60 * 1000),
    });
    res.json({ success: true, challengeId, nonce });
  });

  async function verifyChallenge(provider, body) {
    if (typeof body.challengeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.challengeId)) {
      throw httpError(400, 'Start a new provider sign-in and try again.');
    }
    const challenge = await SocialAuthChallenge.findOne({
      challengeId: body.challengeId, provider, expiresAt: { $gt: currentTime() },
    }).select('+nonceHash').lean();
    if (!challenge) throw httpError(401, 'The provider sign-in request has expired or was already used. Please try again.');
    const identity = await verifier[provider](provider === 'apple' ? body.identityToken : body.idToken);
    if (typeof identity.nonce !== 'string' || nonceHash(identity.nonce) !== challenge.nonceHash) {
      throw httpError(401, 'The provider sign-in request could not be verified. Please try again.');
    }
    const consumed = await SocialAuthChallenge.deleteOne({
      _id: challenge._id, provider, nonceHash: challenge.nonceHash, expiresAt: { $gt: currentTime() },
    });
    if (consumed.deletedCount !== 1) throw httpError(401, 'The provider sign-in request was already used. Please try again.');
    return identity;
  }

  async function socialUser(provider, identity) {
    const identityKey = { authProvider: provider, providerUserId: identity.providerUserId };
    const findOrCreate = async () => {
      // Never link by matching email, even when provider email is verified.
      // Pending local registrations reserve their original sign-in method too.
      if (identity.email) {
        const existingEmail = await User.findOne({ email: identity.email });
        if (existingEmail && (existingEmail.authProvider !== provider || existingEmail.providerUserId !== identity.providerUserId)) {
          throw httpError(409, ORIGINAL_METHOD_MESSAGE);
        }
        if (await EmailVerification.findOne({ email: identity.email }).select('_id').lean()) {
          throw httpError(409, ORIGINAL_METHOD_MESSAGE);
        }
      }
      const existing = await User.findOne(identityKey);
      if (existing) return existing;
      try {
        const created = await User.create([{
          ...identityKey,
          ...(identity.email ? { email: identity.email } : {}),
          isEmailVerified: identity.isEmailVerified === true,
          displayName: identity.displayName || null,
        }]);
        return created[0];
      } catch (error) {
        if (error.code === 11000) {
          const sameIdentity = await User.findOne(identityKey);
          if (sameIdentity) return sameIdentity;
          throw httpError(409, ORIGINAL_METHOD_MESSAGE);
        }
        throw error;
      }
    };
    return identity.email ? withEmailLock(identity.email, findOrCreate) : findOrCreate();
  }

  for (const provider of ['google', 'apple', 'facebook']) {
    router.post(`/social/${provider}`, async (req, res) => {
      const body = req.body || {};
      const identity = provider !== 'apple' && typeof body.code === 'string'
        ? await broker.consumeHandoff({ provider, code: body.code, codeVerifier: body.codeVerifier, redirectUri: body.redirectUri })
        : provider === 'facebook' ? await verifier.facebook(body.accessToken) : await verifyChallenge(provider, body);
      // Apple supplies full name to the native app only on first consent. It is
      // optional display text, never a source of user ID, email, or verification.
      if (provider === 'apple' && typeof body.displayName === 'string') {
        identity.displayName = body.displayName.trim().slice(0, 200) || null;
      }

      if (body.preview) {
        return res.json({
          success: true,
          message: 'Identity retrieved.',
          user: {
            id: 'preview',
            email: identity.email || null,
            isEmailVerified: identity.isEmailVerified === true,
            authProvider: provider,
            displayName: identity.displayName || null
          }
        });
      }

      const user = await socialUser(provider, identity);
      res.json({ success: true, message: 'Login successful.', user: publicUser(user), session: await sessions.issue(user) });
    });
  }

  return router;
}

module.exports = { createAuthRouter };

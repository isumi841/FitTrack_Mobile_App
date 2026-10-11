const { randomInt, randomUUID } = require('node:crypto');
const { isValidEmail, normalizeEmail, getPasswordValidationError } = require('../utils/validation');

const fail = (status, message) => Object.assign(new Error(message), { status, expose: true });
const genericMessage = 'If this email has a password account, a reset code has been sent. For social accounts, use your original sign-in provider.';

// Uses the same email lock as signup and an atomic transaction for single use.
function registerPasswordReset(router, { User, PasswordReset, bcrypt, sendVerificationEmail, withEmailLock, userEmailFilter, currentTime, startSession }) {
  function emailFrom(body) {
    if (!isValidEmail(body?.email)) throw fail(400, 'Enter a valid email address.');
    return normalizeEmail(body.email);
  }

  router.post('/forgot-password', async (req, res) => {
    const email = emailFrom(req.body);
    await withEmailLock(email, async () => {
      const user = await User.findOne(userEmailFilter(email));
      if (!user || (user.authProvider || 'local') !== 'local' || !user.isEmailVerified) return;
      const previous = await PasswordReset.findOne({ email }).select('+otpHash').lean();
      const sentAt = currentTime();
      if (previous && sentAt - new Date(previous.lastSentAt) < 60000) {
        const error = fail(429, 'Please wait 60 seconds before requesting another code.');
        error.retryAfterSeconds = Math.ceil((60000 - sentAt + new Date(previous.lastSentAt).getTime()) / 1000);
        throw error;
      }
      const otp = String(randomInt(1000, 10000));
      const values = { userId: user._id, otpHash: await bcrypt.hash(otp, 12), expiresAt: new Date(sentAt.getTime() + 15 * 60000), lastSentAt: sentAt, attempts: 0, otpVersion: randomUUID(), status: 'sending' };
      if (previous) await PasswordReset.updateOne({ _id: previous._id }, { $set: values });
      else await PasswordReset.create({ email, ...values });
      const filter = { email, otpVersion: values.otpVersion };
      try {
        await sendVerificationEmail({ email, otp, expiresInMinutes: 15, purpose: 'password-reset' });
      } catch {
        if (previous) {
          const { _id, __v, ...rollback } = previous;
          await PasswordReset.updateOne(filter, { $set: rollback });
        } else await PasswordReset.deleteOne(filter);
        throw fail(502, 'We could not send the reset email. Please try again.');
      }
      await PasswordReset.updateOne(filter, { $set: { status: 'ready' } });
    });
    res.json({ success: true, message: genericMessage, email });
  });

  router.post('/reset-password', async (req, res) => {
    const email = emailFrom(req.body);
    const { otp, newPassword } = req.body;
    if (typeof otp !== 'string' || !/^\d{4}$/.test(otp)) throw fail(400, 'Enter the 4-digit code from your email.');
    const passwordError = getPasswordValidationError(newPassword);
    if (passwordError) throw fail(400, passwordError);
    await withEmailLock(email, async () => {
      const pending = await PasswordReset.findOne({ email }).select('+otpHash').lean();
      if (!pending || new Date(pending.expiresAt) <= currentTime()) throw fail(410, 'This reset code has expired. Request a new code.');
      if (pending.status !== 'ready') throw fail(409, 'Your code is still being sent. Please try again shortly.');
      if (pending.attempts >= 5) throw fail(429, 'Too many attempts. Request a new code.');
      const filter = { _id: pending._id, otpVersion: pending.otpVersion, status: 'ready' };
      await PasswordReset.updateOne(filter, { $inc: { attempts: 1 } });
      if (!await bcrypt.compare(otp, pending.otpHash)) throw fail(400, 'Incorrect reset code. Please try again.');
      const passwordHash = await bcrypt.hash(newPassword, 12);
      const transaction = await startSession();
      try {
        await transaction.withTransaction(async () => {
          const consumed = await PasswordReset.deleteOne({ ...filter, expiresAt: { $gt: currentTime() } }, { session: transaction });
          if (consumed.deletedCount !== 1) throw fail(409, 'This code has already been used or expired. Request a new code.');
          const updated = await User.updateOne({ _id: pending.userId, ...userEmailFilter(email), isEmailVerified: true },
            { $set: { passwordHash }, $inc: { sessionVersion: 1 } }, { session: transaction });
          if (updated.modifiedCount !== 1) throw fail(409, 'This account is no longer available.');
        });
      } finally { await transaction.endSession(); }
    });
    res.json({ success: true, message: 'Password updated. Log in with your new password.', email });
  });
}

module.exports = { registerPasswordReset };

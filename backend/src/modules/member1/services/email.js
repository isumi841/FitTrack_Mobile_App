const { isValidEmail, normalizeEmail } = require('../utils/validation');

class EmailDeliveryError extends Error {
  constructor() {
    super('We could not send the verification email. Please try again.');
    this.name = 'EmailDeliveryError';
    this.code = 'EMAIL_DELIVERY_FAILED';
  }
}

function createSmtpTransport(config) {
  // Check the runtime environment too, so production cannot use a permissive config.
  const allowSelfSigned = !config.production && process.env.NODE_ENV !== 'production' &&
    config.email.allowSelfSigned === true;
  return require('nodemailer').createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    requireTLS: config.email.port !== 465,
    tls: { rejectUnauthorized: !allowSelfSigned },
    auth: { user: config.email.user, pass: config.email.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

function createEmailService(config, { transporter } = {}) {
  const mode = config.email.mode ?? 'smtp';
  if (!['development', 'smtp'].includes(mode)) {
    throw new Error('EMAIL_MODE must be development or smtp.');
  }
  if (mode === 'development' && (config.production || process.env.NODE_ENV === 'production')) {
    throw new Error('EMAIL_MODE=development is not allowed when NODE_ENV=production. Use EMAIL_MODE=smtp.');
  }
  // Do not load Nodemailer or create a transport in development mode.
  const mailer = mode === 'smtp' ? transporter || createSmtpTransport(config) : null;

  async function sendVerificationEmail({
    email,
    otp,
    expiresInMinutes = config.otpExpiryMinutes,
  }) {
    if (!isValidEmail(email) || typeof otp !== 'string' || otp.length !== 4 ||
        !/^\d{4}$/.test(otp) ||
        !Number.isFinite(expiresInMinutes) || expiresInMinutes <= 0) {
      throw new EmailDeliveryError();
    }
    const recipientEmail = normalizeEmail(email);

    if (mode === 'development') {
      console.log(`[DEV ONLY] OTP for ${recipientEmail}: ${otp}`);
      return { accepted: true };
    }

    try {
      const result = await mailer.sendMail({
        from: config.email.from,
        to: recipientEmail,
        subject: 'FitTrack Email Verification',
        text: [
          'Welcome to FitTrack.',
          '',
          'Your verification code is:',
          '',
          otp,
          '',
          `This code expires in ${expiresInMinutes} minutes.`,
          '',
          'If you did not request this code, you can ignore this email.',
        ].join('\n'),
        html: `<div style="font-family:Arial,sans-serif;color:#111312;max-width:480px">` +
          `<h2>Welcome to FitTrack.</h2><p>Your verification code is:</p>` +
          `<p style="font-size:30px;font-weight:700;letter-spacing:6px">${otp}</p>` +
          `<p>This code expires in ${expiresInMinutes} minutes.</p>` +
          `<p>If you did not request this code, you can ignore this email.</p></div>`,
      });
      const accepted = Array.isArray(result.accepted) && result.accepted.some((recipient) => {
        const address = typeof recipient === 'string' ? recipient : recipient?.address;
        return typeof address === 'string' && address.toLowerCase() === recipientEmail.toLowerCase();
      });
      if (!accepted) {
        throw new EmailDeliveryError();
      }
      // SMTP acceptance is the delivery checkpoint, not a claim about inbox arrival.
      return { accepted: true };
    } catch (err) {
      if (!(err instanceof EmailDeliveryError)) {
        console.error('Nodemailer sendMail failed safely:', { name: err?.name, code: err?.code, message: err?.message });
      }
      // SMTP details can include credentials or message contents; never expose them.
      throw new EmailDeliveryError();
    }
  }

  return { sendVerificationEmail };
}

module.exports = { createEmailService, createSmtpTransport, EmailDeliveryError };

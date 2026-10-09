const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { loadConfig } = require('../config');
const { createEmailService, createSmtpTransport, EmailDeliveryError } = require('../services/email');

// Synthetic configuration only: never load the application's credential file.
const smtpEnv = {
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
  EMAIL_MODE: 'smtp',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: '587',
  EMAIL_USER: 'fittrack.sender@gmail.com',
  EMAIL_PASS: ' test-only-app-password ',
  EMAIL_FROM: 'fittrack.sender@gmail.com',
  JWT_SECRET: 'fittrack_test_jwt_secret_1234567890_abcd',
};

function setNodeEnv(t, value) {
  const previous = process.env.NODE_ENV;
  if (value === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = value;
  t.after(() => {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  });
}

function captureTransport(t) {
  const captured = [];
  t.mock.method(nodemailer, 'createTransport', (options) => {
    captured.push(options);
    return { async sendMail(message) { return { accepted: [message.to] }; } };
  });
  return captured;
}

test('SMTP certificate validation is the default and only exact true opts in locally', (t) => {
  setNodeEnv(t, 'development');
  const captured = captureTransport(t);
  for (const value of [undefined, '', 'false', 'TRUE', 'True', '1', ' true ', true]) {
    const config = loadConfig({ ...smtpEnv, SMTP_ALLOW_SELF_SIGNED: value });
    assert.equal(config.email.allowSelfSigned, false, `Unexpected opt-in for ${String(value)}`);
    createSmtpTransport(config);
    assert.notEqual(captured.at(-1).tls?.rejectUnauthorized, false);
  }
  const optedIn = loadConfig({ ...smtpEnv, SMTP_ALLOW_SELF_SIGNED: 'true' });
  assert.equal(optedIn.email.allowSelfSigned, true);
  createSmtpTransport(optedIn);
  assert.equal(captured.at(-1).tls.rejectUnauthorized, false);
});

test('all nonproduction environments may explicitly opt in to local SMTP testing', (t) => {
  setNodeEnv(t, undefined);
  const captured = captureTransport(t);
  for (const nodeEnv of [undefined, 'development', 'test']) {
    const config = loadConfig({ ...smtpEnv, NODE_ENV: nodeEnv, SMTP_ALLOW_SELF_SIGNED: 'true' });
    assert.equal(config.production, false);
    assert.equal(config.email.allowSelfSigned, true);
    createSmtpTransport(config);
    assert.equal(captured.at(-1).tls.rejectUnauthorized, false);
  }
});

test('production ignores local SMTP opt-in and protects against a tampered config', (t) => {
  setNodeEnv(t, 'development');
  const captured = captureTransport(t);
  const config = loadConfig({
    ...smtpEnv,
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://fittrack.example.test',
    SMTP_ALLOW_SELF_SIGNED: 'true',
  });
  assert.equal(config.production, true);
  assert.equal(config.email.allowSelfSigned, false);
  createSmtpTransport(config);
  assert.notEqual(captured.at(-1).tls?.rejectUnauthorized, false);
  createSmtpTransport({ ...config, email: { ...config.email, allowSelfSigned: true } });
  assert.notEqual(captured.at(-1).tls?.rejectUnauthorized, false);
});

test('actual production process keeps certificate validation even with nonproduction config', (t) => {
  setNodeEnv(t, 'production');
  const captured = captureTransport(t);
  const config = loadConfig({ ...smtpEnv, SMTP_ALLOW_SELF_SIGNED: 'true' });
  assert.equal(config.production, false);
  assert.equal(config.email.allowSelfSigned, true);
  createSmtpTransport(config);
  assert.notEqual(captured.at(-1).tls?.rejectUnauthorized, false);
});

test('local SMTP opt-in preserves Gmail STARTTLS, credentials, and disabled diagnostic logging', (t) => {
  setNodeEnv(t, 'development');
  const captured = captureTransport(t);
  for (const allowSelfSigned of ['false', 'true']) {
    createEmailService(loadConfig({ ...smtpEnv, SMTP_ALLOW_SELF_SIGNED: allowSelfSigned }));
    const options = captured.at(-1);
    assert.equal(options.host, 'smtp.gmail.com');
    assert.equal(options.port, 587);
    assert.equal(options.secure, false);
    assert.equal(options.requireTLS, true);
    assert.deepEqual(options.auth, { user: smtpEnv.EMAIL_USER, pass: smtpEnv.EMAIL_PASS });
    assert.equal(options.logger, false);
    assert.equal(options.debug, false);
  }
});

test('SMTP delivery with local opt-in never logs OTPs or diagnostics on success or failure', async (t) => {
  setNodeEnv(t, 'development');
  const logs = [];
  for (const method of ['log', 'info', 'warn', 'error', 'debug']) {
    t.mock.method(console, method, (...args) => logs.push(args));
  }
  let sent;
  let shouldFail = false;
  t.mock.method(nodemailer, 'createTransport', () => ({
    async sendMail(message) {
      sent = message;
      if (shouldFail) throw new Error('SMTP diagnostic containing test OTP and credential details');
      return { accepted: [message.to] };
    },
  }));
  const service = createEmailService(loadConfig({ ...smtpEnv, SMTP_ALLOW_SELF_SIGNED: 'true' }));
  const payload = { email: 'member@example.test', otp: '012345' };
  assert.deepEqual(await service.sendVerificationEmail(payload), { accepted: true });
  assert.equal(sent.from, smtpEnv.EMAIL_FROM);
  assert.equal(sent.to, payload.email);
  shouldFail = true;
  await assert.rejects(service.sendVerificationEmail(payload), EmailDeliveryError);
  assert.deepEqual(logs, []);
});

test('development email mode retains local OTP delivery without creating an SMTP transport', async (t) => {
  setNodeEnv(t, 'development');
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args));
  const transport = t.mock.method(nodemailer, 'createTransport', () => {
    throw new Error('Development email mode must not create an SMTP transport.');
  });
  const config = loadConfig({
    NODE_ENV: 'development',
    MONGODB_URI: smtpEnv.MONGODB_URI,
    EMAIL_MODE: 'development',
    SMTP_ALLOW_SELF_SIGNED: 'true',
    JWT_SECRET: smtpEnv.JWT_SECRET,
  });
  const service = createEmailService(config);
  assert.deepEqual(await service.sendVerificationEmail({
    email: 'Member@example.test', otp: '012345',
  }), { accepted: true });
  assert.deepEqual(logs, [['[DEV ONLY] OTP for member@example.test: 012345']]);
  assert.equal(transport.mock.callCount(), 0);
});

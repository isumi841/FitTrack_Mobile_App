const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { loadConfig } = require('../config');
const { createEmailService, EmailDeliveryError } = require('../services/email');
const { createAuthRateLimiter } = require('../middleware/auth-rate-limit');
const { isValidEmail, normalizeEmail, isStrongPassword } = require('../utils/validation');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');

const env = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test', EMAIL_HOST: 'smtp.example.test',
  EMAIL_USER: 'test-user', EMAIL_PASS: 'test-only-password', EMAIL_FROM: 'FitTrack <test@example.test>',
  JWT_SECRET: 'fittrack_test_jwt_secret_1234567890_abcd',
};

test('configuration defaults, required fields, and explicit production origins', () => {
  const config = loadConfig(env);
  assert.equal(config.port, 5000);
  assert.equal(config.otpExpiryMinutes, 5);
  assert.equal(config.email.mode, 'smtp');
  assert.equal(config.production, false);
  assert.equal(config.email.port, 587);
  assert.throws(() => loadConfig({ ...env, MONGODB_URI: '' }), /MONGODB_URI/);
  assert.throws(() => loadConfig({ ...env, EMAIL_PASS: '' }), /EMAIL_PASS/);
  assert.throws(() => loadConfig({ ...env, OTP_EXPIRY_MINUTES: '0' }), /OTP_EXPIRY_MINUTES/);
  assert.throws(() => loadConfig({ ...env, NODE_ENV: 'production' }), /CORS_ORIGINS/);
  assert.throws(() => loadConfig({ ...env, NODE_ENV: 'production', CORS_ORIGINS: 'http://example.test' }), /HTTPS/);
  assert.deepEqual(loadConfig({ ...env, NODE_ENV: 'production', CORS_ORIGINS: 'https://example.test' }).corsOrigins, ['https://example.test']);
});

test('development email mode needs MongoDB but no SMTP credentials', () => {
  const config = loadConfig({ MONGODB_URI: env.MONGODB_URI, EMAIL_MODE: 'development', JWT_SECRET: env.JWT_SECRET });
  assert.equal(config.email.mode, 'development');
  assert.equal(config.production, false);
  assert.equal(config.mongodbUri, env.MONGODB_URI);
  assert.equal(config.otpExpiryMinutes, 5);
  assert.throws(() => loadConfig({ EMAIL_MODE: 'development', JWT_SECRET: env.JWT_SECRET }), /MONGODB_URI/);
});

test('email mode is explicit and development OTP logging cannot run in production', () => {
  for (const mode of ['', 'invalid', 'Development', 'SMTP', ' development ']) {
    assert.throws(() => loadConfig({ ...env, EMAIL_MODE: mode }), /EMAIL_MODE/);
  }
  assert.equal(loadConfig({ ...env, EMAIL_MODE: 'smtp' }).email.mode, 'smtp');
  assert.throws(() => loadConfig({
    MONGODB_URI: env.MONGODB_URI,
    EMAIL_MODE: 'development',
    JWT_SECRET: env.JWT_SECRET,
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://example.test',
  }), /development|production/i);
  assert.throws(() => createEmailService({
    production: true, email: { mode: 'development' }, otpExpiryMinutes: 5,
  }), /development|production/i);
  assert.equal(loadConfig({
    ...env, EMAIL_MODE: 'smtp', NODE_ENV: 'production', CORS_ORIGINS: 'https://example.test',
  }).production, true);
});

test('general email validation accepts university and personal addresses while rejecting malformed ones', () => {
  for (const address of ['IT87654321@my.sliit.lk', 'example@gmail.com', 'example@yahoo.com',
    'example@outlook.com', 'first.last+fitness@sub.example.co.uk', 'it87654321@MY.SLIIT.LK',
    'CS87654321@my.sliit.lk']) {
    assert.equal(isValidEmail(address), true, address);
  }
  for (const address of ['example', 'example@gmail', 'example@@gmail.com', '.example@gmail.com',
    'example.@gmail.com', 'example..name@gmail.com', 'example@-gmail.com', 'example@gmail-.com',
    'example@gma il.com', 'example@gmail.com\n', `${'a'.repeat(65)}@gmail.com`,
    `example@${'a'.repeat(64)}.com`, null, { $ne: null }]) {
    assert.equal(isValidEmail(address), false);
  }
  assert.equal(normalizeEmail('Example@GMAIL.COM'), 'example@gmail.com');
  assert.equal(normalizeEmail('it87654321@MY.SLIIT.LK'), 'it87654321@my.sliit.lk');
  assert.equal(normalizeEmail('invalid address'), '');
});

test('strong passwords stay within bcrypt byte limit', () => {
  assert.equal(isStrongPassword('FitTrack@123'), true);
  assert.equal(isStrongPassword(`Aa1!${'a'.repeat(68)}`), true);
  assert.equal(isStrongPassword(`Aa1!${'a'.repeat(69)}`), false);
  assert.equal(isStrongPassword(`Aa1!${'é'.repeat(35)}`), false);
  assert.equal(isStrongPassword('FitTrack123 '), false);
});

test('model indexes and JSON redaction protect stored authentication data', async () => {
  const user = new User({ email: 'IT12345678@my.sliit.lk', passwordHash: 'stored-hash', isEmailVerified: true });
  assert.equal(user.toJSON().passwordHash, undefined);
  assert.equal(User.schema.path('passwordHash').options.select, false);
  assert.equal(User.schema.indexes().some(([keys, options]) => keys.email === 1 && options.unique), true);
  const pending = new EmailVerification({ email: 'IT12345678@my.sliit.lk', passwordHash: 'stored-password-hash',
    otpHash: 'stored-otp-hash', expiresAt: new Date(), lastSentAt: new Date(), otpVersion: 'version', deliveryToken: 'private-token' });
  assert.equal(pending.toJSON().passwordHash, undefined);
  assert.equal(pending.toJSON().otpHash, undefined);
  assert.equal(pending.toJSON().deliveryToken, undefined);
  assert.equal(EmailVerification.schema.indexes().some(([keys, options]) => keys.expiresAt === 1 && options.expireAfterSeconds === 86400), true);
  const personalUser = new User({ email: 'Example@GMAIL.COM', authProvider: 'google', providerUserId: 'provider-subject' });
  assert.equal(personalUser.email, 'example@gmail.com');
  await personalUser.validate();
  const personalPending = new EmailVerification({ email: 'Example@OUTLOOK.COM', passwordHash: 'stored-hash',
    otpHash: 'stored-otp-hash', expiresAt: new Date(), lastSentAt: new Date(), otpVersion: 'version' });
  await personalPending.validate();
});

test('personal OTP recipients never replace the configured SMTP account or sender', async (t) => {
  let options;
  let sent;
  const recipient = 'example@gmail.com';
  t.mock.method(nodemailer, 'createTransport', (settings) => {
    options = settings;
    return { async sendMail(message) { sent = message; return { accepted: [recipient] }; } };
  });
  const config = loadConfig(env);
  const service = createEmailService(config);
  await service.sendVerificationEmail({ email: recipient, otp: '1234' });
  assert.equal(options.auth.user, env.EMAIL_USER);
  assert.equal(options.auth.pass, env.EMAIL_PASS);
  assert.equal(sent.from, env.EMAIL_FROM);
  assert.equal(sent.to, recipient);
  assert.notEqual(options.auth.user, recipient);
  assert.notEqual(sent.from, recipient);
});

test('development OTP delivery logs only the normalized recipient and code without touching SMTP', async (t) => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args));
  const transport = t.mock.method(nodemailer, 'createTransport', () => {
    throw new Error('Development mode must not create an SMTP transport.');
  });
  let smtpCalls = 0;
  const config = loadConfig({ MONGODB_URI: env.MONGODB_URI, EMAIL_MODE: 'development', JWT_SECRET: env.JWT_SECRET });
  const service = createEmailService(config);
  assert.deepEqual(await service.sendVerificationEmail({ email: 'Example@GMAIL.COM', otp: '0123' }), { accepted: true });
  // Even an explicitly supplied transport must be bypassed in development.
  const injectedService = createEmailService(config, { transporter: {
    async sendMail() { smtpCalls++; throw new Error('Development mode must not send SMTP email.'); },
  } });
  assert.deepEqual(await injectedService.sendVerificationEmail({ email: 'it12345678@MY.SLIIT.LK', otp: '1234' }), { accepted: true });
  assert.deepEqual(logs, [
    ['[DEV ONLY] OTP for example@gmail.com: 0123'],
    ['[DEV ONLY] OTP for it12345678@my.sliit.lk: 1234'],
  ]);
  assert.equal(transport.mock.callCount(), 0);
  assert.equal(smtpCalls, 0);
});

test('invalid development email payloads do not print a code or contact SMTP', async (t) => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args));
  const transport = t.mock.method(nodemailer, 'createTransport', () => {
    throw new Error('Development mode must not create an SMTP transport.');
  });
  const service = createEmailService(loadConfig({ MONGODB_URI: env.MONGODB_URI, EMAIL_MODE: 'development', JWT_SECRET: env.JWT_SECRET }));
  for (const payload of [
    { email: 'invalid email', otp: '1234' },
    { email: 'example@gmail.com\n', otp: '1234' },
    { email: 'example@gmail.com', otp: 1234 },
    { email: 'example@gmail.com', otp: '12345' },
    { email: 'example@gmail.com', otp: '1234\n' },
    { email: 'example@gmail.com', otp: '1234', expiresInMinutes: 0 },
    { email: 'example@gmail.com', otp: '1234', expiresInMinutes: Number.NaN },
  ]) {
    await assert.rejects(service.sendVerificationEmail(payload), EmailDeliveryError);
  }
  assert.deepEqual(logs, []);
  assert.equal(transport.mock.callCount(), 0);
});

test('SMTP mode sends real email without logging OTPs on success or failure', async (t) => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args));
  let sent;
  const config = loadConfig({ ...env, EMAIL_MODE: 'smtp' });
  const service = createEmailService(config, { transporter: {
    async sendMail(message) { sent = message; return { accepted: ['example@gmail.com'] }; },
  } });
  assert.deepEqual(await service.sendVerificationEmail({ email: 'example@gmail.com', otp: '1234' }), { accepted: true });
  assert.equal(sent.from, env.EMAIL_FROM);
  assert.equal(sent.to, 'example@gmail.com');
  assert.match(sent.text, /1234/);
  const failingService = createEmailService(config, { transporter: {
    async sendMail() { throw new Error('SMTP diagnostic containing code 1234'); },
  } });
  await assert.rejects(failingService.sendVerificationEmail({ email: 'example@gmail.com', otp: '1234' }), EmailDeliveryError);
  assert.deepEqual(logs, []);
});

test('email succeeds only after SMTP accepts the intended recipient', async () => {
  let sent;
  const service = createEmailService(loadConfig(env), { transporter: {
    async sendMail(payload) { sent = payload; return { accepted: ['IT12345678@my.sliit.lk'] }; },
  } });
  await service.sendVerificationEmail({ email: 'IT12345678@my.sliit.lk', otp: '1234' });
  assert.equal(sent.to, 'it12345678@my.sliit.lk');
  assert.match(sent.text, /1234/);
  const rejected = createEmailService(loadConfig(env), { transporter: {
    async sendMail() { return { accepted: ['someone@example.test'] }; },
  } });
  await assert.rejects(rejected.sendVerificationEmail({ email: 'IT12345678@my.sliit.lk', otp: '1234' }), EmailDeliveryError);
  await assert.rejects(service.sendVerificationEmail({ email: 'IT12345678@my.sliit.lk', otp: '1234\n' }), EmailDeliveryError);
});

test('SMTP errors cannot expose credentials or the emailed code', async () => {
  const service = createEmailService(loadConfig(env), { transporter: {
    async sendMail() { throw new Error('SMTP diagnostic with credentials and message'); },
  } });
  await assert.rejects(service.sendVerificationEmail({ email: 'IT12345678@my.sliit.lk', otp: '1234' }), (error) => {
    assert.equal(error.code, 'EMAIL_DELIVERY_FAILED');
    assert.equal(error.message.includes('credentials'), false);
    assert.equal(error.message.includes('1234'), false);
    return true;
  });
});

test('IP request limit blocks excess requests and resets after the window', () => {
  let time = 100000;
  let status;
  let nextCalls = 0;
  const limiter = createAuthRateLimiter({ maxRequests: 2, windowMs: 1000, now: () => time });
  const request = { ip: '127.0.0.1' };
  const response = { setHeader() {}, status(code) { status = code; return this; }, json() {} };
  const next = () => { nextCalls++; };
  limiter(request, response, next);
  limiter(request, response, next);
  limiter(request, response, next);
  assert.equal(nextCalls, 2);
  assert.equal(status, 429);
  time += 1000;
  limiter(request, response, next);
  assert.equal(nextCalls, 3);
});

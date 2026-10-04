const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { loadConfig } = require('../config');
const { createEmailService } = require('../services/email');
const { createApp } = require('../server');
const { createAuthRouter } = require('../routes/auth');
const { createMemoryModels } = require('./helpers/memory-models');

const email = 'IT12345678@my.sliit.lk';
const password = 'FitTrack@123';
const signupBody = { email, password, confirmPassword: password };

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function harness(t, { config: suppliedConfig, sendVerificationEmail } = {}) {
  const database = createMemoryModels();
  const fixture = {
    ...database,
    emails: [],
    mailFailure: false,
    compareHook: null,
    timestamp: Date.parse('2026-01-01T00:00:00Z'),
  };
  const config = {
    otpExpiryMinutes: 5,
    corsOrigins: ['http://localhost:8081'],
    jwt: { secret: 'fittrack_test_jwt_secret_1234567890_abcd', expiryMinutes: 60 },
    ...(suppliedConfig || {}),
  };
  const authRouter = createAuthRouter({
    ...database,
    config,
    now: () => new Date(fixture.timestamp),
    // Exercise real bcrypt with a smaller cost only in tests, and check that
    // production routes consistently request the configured 12 rounds.
    bcrypt: {
      hash(value, rounds) {
        assert.equal(rounds, 12);
        return bcrypt.hash(value, 4);
      },
      async compare(value, hash) {
        if (fixture.compareHook) await fixture.compareHook(value, hash);
        return bcrypt.compare(value, hash);
      },
    },
    sendVerificationEmail: sendVerificationEmail || async function (payload) {
      if (fixture.mailFailure) throw new Error('private SMTP details');
      fixture.emails.push(payload);
    },
  });
  const app = createApp({ config, authRouter });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  fixture.url = `http://127.0.0.1:${server.address().port}`;
  fixture.post = async (endpoint, body) => {
    const response = await fetch(`${fixture.url}/api/auth/${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  };
  return fixture;
}

test('development signup and resend keep hashed OTPs and verification without leaking codes in API responses', async (t) => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args));
  const transport = t.mock.method(nodemailer, 'createTransport', () => {
    throw new Error('Development flow must not create an SMTP transport.');
  });
  const config = loadConfig({
    MONGODB_URI: 'mongodb://127.0.0.1:27017/test', EMAIL_MODE: 'development', JWT_SECRET: 'fittrack_test_jwt_secret_1234567890_abcd',
  });
  const service = createEmailService(config);
  const f = await harness(t, { config, sendVerificationEmail: service.sendVerificationEmail });
  const enteredEmail = 'IT12345678@my.sliit.lk';
  const canonicalEmail = 'IT12345678@my.sliit.lk';
  const body = { ...signupBody, email: enteredEmail };
  const signup = await f.post('signup', body);
  assert.equal(signup.status, 201);
  assert.deepEqual(Object.keys(signup.body).sort(), ['email', 'message', 'success']);
  assert.equal(signup.body.email, canonicalEmail);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].length, 1);
  const match = /^\[DEV ONLY\] OTP for IT12345678@my\.sliit\.lk: (\d{4})$/.exec(logs[0][0]);  assert.ok(match);
  const initialOtp = match[1];
  const pending = f.state.pending[0];
  const originalHash = pending.otpHash;
  const passwordHash = pending.passwordHash;
  assert.equal(pending.status, 'ready');
  assert.equal(pending.expiresAt.getTime(), f.timestamp + 5 * 60 * 1000);
  assert.equal(await bcrypt.compare(initialOtp, pending.otpHash), true);
  assert.equal(await bcrypt.compare(password, passwordHash), true);
  assert.notEqual(pending.otpHash, initialOtp);
  assert.equal(f.state.users.length, 0);
  assert.equal(JSON.stringify(signup.body).includes(initialOtp), false);
  assert.equal((await f.post('signup', body)).status, 409);
  assert.equal((await f.post('resend-otp', { email: enteredEmail })).status, 429);
  assert.equal(logs.length, 1);
  const wrongOtp = initialOtp === '0000' ? '1111' : '0000';
  assert.equal((await f.post('verify-email', { email: enteredEmail, otp: wrongOtp })).status, 400);
  assert.equal(f.state.pending[0].attempts, 1);
  f.timestamp += 60000;
  const resend = await f.post('resend-otp', { email: enteredEmail });
  assert.equal(resend.status, 200);
  assert.equal(logs.length, 2);
  const resendMatch = /^\[DEV ONLY\] OTP for IT12345678@my\.sliit\.lk: (\d{4})$/.exec(logs[1][0]);  assert.ok(resendMatch);
  const resentOtp = resendMatch[1];
  assert.deepEqual(Object.keys(resend.body).sort(), ['email', 'message', 'success']);
  assert.equal(JSON.stringify(resend.body).includes(resentOtp), false);
  assert.notEqual(f.state.pending[0].otpHash, originalHash);
  assert.equal(f.state.pending[0].passwordHash, passwordHash);
  assert.equal(f.state.pending[0].attempts, 0);
  assert.equal(f.state.pending[0].expiresAt.getTime(), f.timestamp + 5 * 60 * 1000);
  assert.equal(await bcrypt.compare(resentOtp, f.state.pending[0].otpHash), true);
  const verified = await f.post('verify-email', { email: enteredEmail, otp: resentOtp });
  assert.equal(verified.status, 201);
  assert.equal(verified.body.user.isEmailVerified, true);
  assert.deepEqual(Object.keys(verified.body.user).sort(), ['authProvider', 'displayName', 'email', 'id', 'isEmailVerified']);
  assert.equal(JSON.stringify(verified.body).includes(resentOtp), false);
  assert.equal(f.state.pending.length, 0);
  assert.equal(f.state.users.length, 1);
  const login = await f.post('login', { email: enteredEmail, password });
  assert.equal(login.status, 200);
  assert.equal(JSON.stringify(login.body).includes(resentOtp), false);
  assert.equal((await f.post('signup', body)).status, 409);
  assert.equal((await f.post('resend-otp', { email: enteredEmail })).status, 409);
  assert.equal(logs.length, 2);
  assert.equal(transport.mock.callCount(), 0);
});

test('signup stores only hashes; verification creates one verified user; login works', async (t) => {
  const f = await harness(t);
  const signup = await f.post('signup', signupBody);
  assert.equal(signup.status, 201);
  assert.equal(signup.body.success, true);
  assert.equal(signup.headers.get('cache-control'), 'no-store');
  assert.equal(f.state.users.length, 0);
  assert.equal(f.state.pending.length, 1);
  const pending = f.state.pending[0];
  const otp = f.emails[0].otp;
  assert.match(otp, /^\d{4}$/);
  assert.equal(pending.status, 'ready');
  assert.equal(pending.expiresAt.getTime() - f.timestamp, 5 * 60 * 1000);
  assert.equal(await bcrypt.compare(password, pending.passwordHash), true);
  assert.equal(await bcrypt.compare(otp, pending.otpHash), true);
  assert.notEqual(pending.passwordHash, password);
  assert.notEqual(pending.otpHash, otp);
  assert.deepEqual(Object.keys(signup.body).sort(), ['email', 'message', 'success']);

  assert.equal((await f.post('login', { email, password })).status, 403);
  const verified = await f.post('verify-email', { email, otp });
  assert.equal(verified.status, 201);
  assert.equal(verified.body.user.isEmailVerified, true);
  assert.deepEqual(Object.keys(verified.body.user).sort(), ['authProvider', 'displayName', 'email', 'id', 'isEmailVerified']);
  assert.equal(f.state.users.length, 1);
  assert.equal(f.state.pending.length, 0);
  assert.equal((await f.post('login', { email, password: 'Wrong@123' })).status, 401);
  assert.equal((await f.post('login', { email, password })).status, 200);
  assert.equal((await f.post('signup', signupBody)).status, 409);
  assert.equal((await f.post('resend-otp', { email })).status, 409);
});

test('invalid input is rejected before creating pending records or sending email', async (t) => {
  const f = await harness(t);
  for (const invalidEmail of [null, { $ne: null }, 'example.gmail.com', 'example@',
    'example@@gmail.com', 'example..name@gmail.com', 'example@-gmail.com', `${email}\n`, ` ${email}`]) {
    assert.equal((await f.post('signup', { ...signupBody, email: invalidEmail })).status, 400);
  }
  for (const weak of ['Aa1!aaa', 'fittrack@123', 'FITTRACK@123', 'FitTrack@abc', 'FitTrack123', 'FitTrack123 ']) {
    assert.equal((await f.post('signup', { ...signupBody, password: weak, confirmPassword: weak })).status, 400);
  }
  assert.equal((await f.post('signup', { ...signupBody, confirmPassword: 'different' })).status, 400);
  const longPassword = `${password}${'a'.repeat(73)}`;
  assert.equal((await f.post('signup', { ...signupBody, password: longPassword, confirmPassword: longPassword })).status, 400);
  assert.equal((await f.post('login', { email: 'example@outlook.com', password })).status, 404);
  assert.equal((await f.post('login', { email, password: '' })).status, 400);
  assert.equal((await f.post('login', { email, password: longPassword })).status, 401);
  assert.equal(f.state.pending.length, 0);
  assert.equal(f.emails.length, 0);
});

test('personal email signup creates password accounts without a campus OTP', async (t) => {
  const f = await harness(t);

  for (const personalEmail of [
    'example@gmail.com',
    'example@yahoo.com',
    'example@outlook.com',
  ]) {
    const signup = await f.post('signup', {
      ...signupBody,
      email: personalEmail,
    });

    assert.equal(signup.status, 201);
    assert.equal(typeof signup.body.session.accessToken, 'string');

    const login = await f.post('login', {
      email: personalEmail,
      password,
    });

    assert.equal(login.status, 200);
  }

  assert.equal(f.state.pending.length, 0);
  assert.equal(f.state.users.length, 3);
  assert.equal(f.emails.length, 0);
});

test('existing uppercase SLIIT account keys remain usable through mixed-case input', async (t) => {
  const f = await harness(t);
  f.state.users.push({ _id: 'legacy', email, passwordHash: await bcrypt.hash(password, 4), isEmailVerified: true });
  const input = 'it12345678@MY.SLIIT.LK';
  const login = await f.post('login', { email: input, password });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.email, email);
  assert.equal((await f.post('signup', { ...signupBody, email: input })).status, 409);
  assert.equal(f.state.users.length, 1);
});

test('personal email signup keeps normalized addresses unique', async (t) => {
  const f = await harness(t);
  const first = await f.post('signup', { ...signupBody, email: 'Example@gmail.com' });
  const second = await f.post('signup', { ...signupBody, email: 'example@GMAIL.COM' });
  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
  assert.equal(f.state.pending.length, 0);
  assert.equal(f.state.users.length, 1);
});

test('personal email and password signup issues a session without entering campus OTP', async (t) => {
  const f = await harness(t);
  const personalEmail = 'member@example.com';
  const response = await f.post('signup', {
    email: personalEmail,
    password,
    confirmPassword: password,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, personalEmail);
  assert.equal(response.body.user.isEmailVerified, true);
  assert.equal(typeof response.body.session.accessToken, 'string');
  assert.equal(f.state.pending.length, 0);
  assert.equal(f.emails.length, 0);
  assert.equal(await bcrypt.compare(password, f.state.users[0].passwordHash), true);
  assert.equal((await f.post('login', { email: personalEmail, password })).status, 200);
});

test('OTP must be a four-character string and malformed codes do not spend attempts', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  for (const otp of [1234, '123', '12345', '1234\n', ' 123', { $ne: null }]) {
    assert.equal((await f.post('verify-email', { email, otp })).status, 400);
  }
  assert.equal(f.state.pending[0].attempts, 0);
});

test('code is expired at the exact deadline and expired requests can be resent', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  const oldOtp = f.emails[0].otp;
  const oldHash = f.state.pending[0].otpHash;
  f.timestamp += 5 * 60 * 1000;
  const expired = await f.post('verify-email', { email, otp: oldOtp });
  assert.equal(expired.status, 410);
  assert.match(expired.body.message, /expired/i);
  assert.equal(f.state.users.length, 0);
  assert.equal((await f.post('resend-otp', { email })).status, 200);
  assert.notEqual(f.state.pending[0].otpHash, oldHash);
  assert.equal(f.state.pending[0].attempts, 0);
  assert.equal(f.state.pending[0].expiresAt.getTime(), f.timestamp + 5 * 60 * 1000);
});

test('parallel wrong guesses cannot exceed the five-attempt budget', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  const otp = f.emails[0].otp;
  const wrong = otp === '0000' ? '1111' : '0000';
  const results = await Promise.all(Array.from({ length: 8 }, () => f.post('verify-email', { email, otp: wrong })));
  assert.equal(results.filter((result) => result.status === 400).length, 4);
  assert.equal(results.filter((result) => result.status === 429).length, 4);
  assert.equal(f.state.pending[0].attempts, 5);
  assert.equal((await f.post('verify-email', { email, otp })).status, 429);
  assert.equal(f.state.users.length, 0);
});

test('resend cooldown and concurrent resends allow only one delivery', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  const passwordHash = f.state.pending[0].passwordHash;
  assert.equal((await f.post('resend-otp', { email })).status, 429);
  f.timestamp += 60000;
  const responses = await Promise.all([f.post('resend-otp', { email }), f.post('resend-otp', { email })]);
  assert.equal(responses.filter((response) => response.status === 200).length, 1);
  assert.equal(f.emails.length, 2);
  assert.equal(f.state.pending[0].passwordHash, passwordHash);
});

test('repeated signup cannot change an existing pending password', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  const hash = f.state.pending[0].passwordHash;
  f.timestamp += 60000;
  const otherPassword = 'Different@123';
  const response = await f.post('signup', { email, password: otherPassword, confirmPassword: otherPassword });
  assert.equal(response.status, 409);
  assert.equal(f.state.pending[0].passwordHash, hash);
  assert.equal(f.emails.length, 1);
});

test('failed initial email leaves no pending challenge or created user', async (t) => {
  const f = await harness(t);
  f.mailFailure = true;
  const failed = await f.post('signup', signupBody);
  assert.equal(failed.status, 503);
  assert.match(failed.body.message, /send the verification email/i);
  assert.equal(JSON.stringify(failed.body).includes('private SMTP'), false);
  assert.equal(f.state.pending.length, 0);
  assert.equal(f.state.users.length, 0);
  f.mailFailure = false;
  assert.equal((await f.post('signup', signupBody)).status, 201);
});

test('failed resend restores the previously delivered challenge and attempts', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  await f.post('verify-email', { email, otp: '000000' });
  const previous = structuredClone(f.state.pending[0]);
  f.timestamp += 60000;
  f.mailFailure = true;
  assert.equal((await f.post('resend-otp', { email })).status, 503);
  assert.deepEqual(f.state.pending[0], previous);
  f.mailFailure = false;
  assert.equal((await f.post('verify-email', { email, otp: f.emails[0].otp })).status, 201);
});

test('an expired send reservation can recover without replacing the password', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  const previousHash = f.state.pending[0].passwordHash;
  f.state.pending[0].status = 'sending';
  f.state.pending[0].deliveryToken = 'interrupted-delivery';
  assert.equal((await f.post('resend-otp', { email })).status, 409);
  f.timestamp += 5 * 60 * 1000;
  assert.equal((await f.post('verify-email', { email, otp: f.emails[0].otp })).status, 410);
  assert.equal((await f.post('resend-otp', { email })).status, 200);
  assert.equal(f.state.pending[0].status, 'ready');
  assert.equal(f.state.pending[0].passwordHash, previousHash);
});

test('two simultaneous correct verifications create only one user', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  const results = await Promise.all([1, 2].map(() => f.post('verify-email', { email, otp: f.emails[0].otp })));
  assert.equal(results.filter((result) => result.status === 201).length, 1);
  assert.equal(f.state.users.length, 1);
  assert.equal(f.state.pending.length, 0);
});

test('a resend racing a correct comparison prevents use of the superseded challenge', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  const compareEntered = deferred();
  const releaseCompare = deferred();
  f.compareHook = async () => { compareEntered.resolve(); await releaseCompare.promise; };
  const verification = f.post('verify-email', { email, otp: f.emails[0].otp });
  await compareEntered.promise;
  f.timestamp += 60000;
  assert.equal((await f.post('resend-otp', { email })).status, 200);
  releaseCompare.resolve();
  assert.equal((await verification).status, 409);
  assert.equal(f.state.users.length, 0);
  f.compareHook = null;
  assert.equal((await f.post('verify-email', { email, otp: f.emails.at(-1).otp })).status, 201);
});

test('failed user creation rolls back consumption so verification can be retried', async (t) => {
  const f = await harness(t);
  await f.post('signup', signupBody);
  f.state.failUserCreate = true;
  const result = await f.post('verify-email', { email, otp: f.emails[0].otp });
  assert.equal(result.status, 500);
  assert.equal(JSON.stringify(result.body).includes('private diagnostic'), false);
  assert.equal(f.state.pending.length, 1);
  f.state.failUserCreate = false;
  assert.equal((await f.post('verify-email', { email, otp: f.emails[0].otp })).status, 201);
});

test('unverified stored users cannot log in', async (t) => {
  const f = await harness(t);
  f.state.users.push({ _id: 'existing', email, passwordHash: await bcrypt.hash(password, 4), isEmailVerified: false });
  assert.equal((await f.post('login', { email, password })).status, 403);
});

test('JSON parsing and CORS produce safe API errors', async (t) => {
  const f = await harness(t);
  const blocked = await fetch(`${f.url}/api/auth/signup`, {
    method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: JSON.stringify(signupBody),
  });
  assert.equal(blocked.status, 403);
  const invalid = await fetch(`${f.url}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not-json',
  });
  assert.equal(invalid.status, 400);
  const allowed = await fetch(`${f.url}/api/health`, { headers: { Origin: 'http://localhost:8081' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:8081');
});

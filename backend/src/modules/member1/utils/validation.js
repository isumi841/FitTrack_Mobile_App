const { Buffer } = require('node:buffer');

const SLIIT_EMAIL_REGEX = /^IT\d{8}@my\.sliit\.lk$/i;

const EMAIL_REGEX =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

const BCRYPT_MAX_PASSWORD_BYTES = 72;

const VALIDATION_MESSAGES = {
  email: 'Enter a valid email address.',
  sliitEmail: 'Use your SLIIT student email, e.g. IT12345678@my.sliit.lk',
  password:
    'Password must include uppercase, lowercase, number, special character, and at least 8 characters.',
  passwordLength: 'Password must be no more than 72 UTF-8 bytes.',
  confirmPassword: 'Passwords do not match.',
};

function isValidSliitEmail(email) {
  return isValidEmail(email);
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;

  const value = email;

  if (
    value.length > 254 ||
    /\s/.test(value) ||
    !EMAIL_REGEX.test(value)
  ) {
    return false;
  }

  const [local, domain] = value.split('@');

  return (
    local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') &&
    domain.length <= 253
  );
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return '';

  const value = email.trim();

  if (!isValidEmail(value)) return '';

  return value.toLowerCase();
}

function getPasswordRequirements(password) {
  const value = typeof password === 'string' ? password : '';

  return {
    minLength: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    specialCharacter: /[^A-Za-z0-9\s]/.test(value),
  };
}

function isPasswordWithinBcryptLimit(password) {
  return (
    typeof password === 'string' &&
    Buffer.byteLength(password, 'utf8') <= BCRYPT_MAX_PASSWORD_BYTES
  );
}

function getPasswordValidationError(password) {
  if (
    typeof password !== 'string' ||
    !Object.values(getPasswordRequirements(password)).every(Boolean)
  ) {
    return VALIDATION_MESSAGES.password;
  }

  if (!isPasswordWithinBcryptLimit(password)) {
    return VALIDATION_MESSAGES.passwordLength;
  }

  return null;
}

function isStrongPassword(password) {
  return getPasswordValidationError(password) === null;
}

module.exports = {
  SLIIT_EMAIL_REGEX,
  EMAIL_REGEX,
  BCRYPT_MAX_PASSWORD_BYTES,
  VALIDATION_MESSAGES,
  isValidSliitEmail,
  isValidEmail,
  normalizeEmail,
  getPasswordRequirements,
  isPasswordWithinBcryptLimit,
  getPasswordValidationError,
  isStrongPassword,
};

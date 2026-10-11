export const SLIIT_EMAIL_REGEX = /^IT\d{8}@my\.sliit\.lk$/i;
export const EMAIL_REGEX = /^[A-Za-z0-9!#$%&'*+/=?^_\x60{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_\x60{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

export const AUTH_VALIDATION_MESSAGES = {
  email: 'Enter a valid email address.',
  sliitEmail: 'Use your SLIIT student email, e.g. IT12345678@my.sliit.lk',
  password:
    'Password must include uppercase, lowercase, number, special character, and at least 8 characters.',
  passwordMaxLength: 'Password must be no more than 72 UTF-8 bytes.',
  confirmPassword: 'Passwords do not match.',
} as const;

export interface PasswordRequirementResults {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialCharacter: boolean;
}

export function isValidEmail(email: unknown): email is string {
  // Validate exactly as entered; surrounding spaces are still an input error.
  if (typeof email !== 'string' || email.length > 254 || /\s/.test(email) ||
      !EMAIL_REGEX.test(email)) {
    return false;
  }
  const at = email.indexOf('@');
  return at <= 64 && email.length - at - 1 <= 253;
}

export function normalizeEmail(email: unknown): string {
  if (!isValidEmail(email)) return '';
  return typeof email === 'string' ? email.toLowerCase() : '';
}

export function isValidSliitEmail(email: unknown): email is string {
  return isValidEmail(email);
}

export function getPasswordRequirements(password: string): PasswordRequirementResults {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    // Spaces alone do not satisfy the special-character requirement.
    specialCharacter: /[^A-Za-z0-9\s]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  return Object.values(getPasswordRequirements(password)).every(Boolean);
}

export function getPasswordByteLength(password: string): number {
  return Array.from(password).reduce((length, character) => {
    const codePoint = character.codePointAt(0)!;
    return length + (codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4);
  }, 0);
}

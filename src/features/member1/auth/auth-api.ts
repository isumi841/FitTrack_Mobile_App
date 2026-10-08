import { API_BASE_URL } from '@/config/api';
import { isValidEmail, normalizeEmail } from '@/features/member1/utils/validation';

const REQUEST_TIMEOUT_MS = 45_000;
const NETWORK_MESSAGE = 'Unable to connect to FitTrack. Check your connection and try again.';
const RESPONSE_MESSAGE = 'FitTrack returned an unexpected response. Please try again.';

type AuthApiErrorCode = 'HTTP_ERROR' | 'INVALID_RESPONSE' | 'NETWORK_ERROR' | 'TIMEOUT' | 'ABORTED';

export class AuthApiError extends Error {
  readonly code: AuthApiErrorCode;
  readonly status?: number;
  readonly retryAfterSeconds?: number;

  constructor(message: string, code: AuthApiErrorCode, status?: number, retryAfterSeconds?: number) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface AuthRequestOptions {
  signal?: AbortSignal;
}

export interface SignupRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface EmailSuccessResponse {
  success: true;
  message: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  isEmailVerified: boolean;
  authProvider: 'local' | 'google' | 'apple' | 'facebook';
  displayName: string | null;
  role?: 'user' | 'admin';
}

export interface UserSuccessResponse {
  success: true;
  message: string;
  user: AuthUser;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: string;
}

export interface SessionSuccessResponse extends UserSuccessResponse {
  session: AuthSession;
}

export type SignupSuccessResponse = EmailSuccessResponse | SessionSuccessResponse;

export interface SocialChallengeResponse {
  success: true;
  challengeId: string;
  nonce: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readMessage(value: unknown): string | undefined {
  if (!isRecord(value) || typeof value.message !== 'string' || !value.message.trim()) {
    return undefined;
  }
  return value.message;
}

function matchesEmail(value: unknown, expectedEmail: string): value is string {
  return isValidEmail(value) && normalizeEmail(value) === normalizeEmail(expectedEmail);
}

function readEmailSuccess(value: unknown, expectedEmail: string): EmailSuccessResponse {
  const message = readMessage(value);
  if (!isRecord(value) || value.success !== true || !message || !matchesEmail(value.email, expectedEmail)) {
    throw new AuthApiError(RESPONSE_MESSAGE, 'INVALID_RESPONSE');
  }
  // Return only the public response contract, even if a server adds other fields.
  return { success: true, message, email: value.email };
}

function readUserSuccess(value: unknown, expectedEmail?: string): UserSuccessResponse {
  const message = readMessage(value);
  if (!isRecord(value) || value.success !== true || !message || !isRecord(value.user) ||
      typeof value.user.id !== 'string' || !value.user.id.trim() ||
      (value.user.role !== undefined && !['user', 'admin'].includes(String(value.user.role))) ||
      !(value.user.email === null || isValidEmail(value.user.email)) ||
      typeof value.user.isEmailVerified !== 'boolean' ||
      !['local', 'google', 'apple', 'facebook'].includes(String(value.user.authProvider)) ||
      !(value.user.displayName === null || typeof value.user.displayName === 'string') ||
      (expectedEmail !== undefined && (!matchesEmail(value.user.email, expectedEmail) ||
        value.user.authProvider !== 'local' || value.user.isEmailVerified !== true))) {
    throw new AuthApiError(RESPONSE_MESSAGE, 'INVALID_RESPONSE');
  }
  return {
    success: true,
    message,
    user: {
      id: value.user.id,
      email: value.user.email as string | null,
      isEmailVerified: (value.user.isEmailVerified as boolean | undefined) ?? true,
      authProvider: (value.user.authProvider || 'local') as AuthUser['authProvider'],
      displayName: value.user.displayName as string | null,
      role: (value.user.role || 'user') as AuthUser['role'],
    },
  };
}

// Reuse strict response validation when rehydrating the native session.
export function readSessionSuccess(value: unknown, expectedEmail?: string): SessionSuccessResponse {
  const result = readUserSuccess(value, expectedEmail);
  if (!isRecord(value) || !isRecord(value.session) ||
      typeof value.session.accessToken !== 'string' || !value.session.accessToken.trim() ||
      typeof value.session.expiresAt !== 'string' || !Number.isFinite(Date.parse(value.session.expiresAt))) {
    throw new AuthApiError(RESPONSE_MESSAGE, 'INVALID_RESPONSE');
  }
  return { ...result, session: { accessToken: value.session.accessToken, expiresAt: value.session.expiresAt } };
}

async function post<T>(
  path: string,
  payload: object | undefined,
  readSuccess: (value: unknown) => T,
  { signal }: AuthRequestOptions = {},
  accessToken?: string,
): Promise<T> {
  if (signal?.aborted) {
    throw new AuthApiError('Request cancelled.', 'ABORTED');
  }

  const controller = new AbortController();
  let rejectCancellation: (error: AuthApiError) => void = () => {};
  const cancellation = new Promise<never>((_, reject) => {
    rejectCancellation = reject;
  });
  const cancel = () => {
    controller.abort();
    rejectCancellation(new AuthApiError('Request cancelled.', 'ABORTED'));
  };
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => {
    controller.abort();
    rejectCancellation(new AuthApiError('The request timed out. Please try again.', 'TIMEOUT'));
  }, REQUEST_TIMEOUT_MS);

  const request = async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: payload === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json', Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: controller.signal,
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new AuthApiError(RESPONSE_MESSAGE, 'INVALID_RESPONSE', response.status);
    }
    if (!response.ok || (isRecord(data) && data.success === false)) {
      throw new AuthApiError(
        readMessage(data) || 'The request could not be completed. Please try again.',
        'HTTP_ERROR',
        response.status,
        isRecord(data) && typeof data.retryAfterSeconds === 'number' ? data.retryAfterSeconds : undefined,
      );
    }
    return readSuccess(data);
  };

  try {
    // The timeout covers both the fetch and reading its response body.
    return await Promise.race([request(), cancellation]);
  } catch (error) {
    if (error instanceof AuthApiError) throw error;
    throw new AuthApiError(NETWORK_MESSAGE, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}

export function signup(payload: SignupRequest, options?: AuthRequestOptions): Promise<SignupSuccessResponse> {
  return post('/api/auth/signup', payload, (value) => {
    if (isRecord(value) && isRecord(value.session)) return readSessionSuccess(value, payload.email);
    return readEmailSuccess(value, payload.email);
  }, options);
}

export function verifyEmail(payload: VerifyEmailRequest, options?: AuthRequestOptions): Promise<UserSuccessResponse> {
  return post('/api/auth/verify-email', payload, (value) => readUserSuccess(value, payload.email), options);
}

export function resendOtp(payload: { email: string }, options?: AuthRequestOptions): Promise<EmailSuccessResponse> {
  return post('/api/auth/resend-otp', payload, (value) => readEmailSuccess(value, payload.email), options);
}

export function login(payload: LoginRequest, options?: AuthRequestOptions): Promise<SessionSuccessResponse> {
  return post('/api/auth/login', payload, (value) => readSessionSuccess(value, payload.email), options);
}

export function adminLogin(payload: LoginRequest, options?: AuthRequestOptions): Promise<SessionSuccessResponse> {
  return post('/api/auth/admin/login', payload, (value) => readSessionSuccess(value, payload.email), options);
}

export function adminSignup(payload: LoginRequest, accessToken: string, options?: AuthRequestOptions): Promise<UserSuccessResponse> {
  return post('/api/auth/admin/signup', payload, (value) => readUserSuccess(value, payload.email), options, accessToken);
}

export function getCurrentUser(accessToken: string, options?: AuthRequestOptions): Promise<UserSuccessResponse> {
  return post('/api/auth/me', undefined, (value) => readUserSuccess(value), options, accessToken);
}

export function createAppleChallenge(): Promise<SocialChallengeResponse> {
  return post('/api/auth/social/challenge', { provider: 'apple' }, (value) => {
    if (!isRecord(value) || value.success !== true || typeof value.challengeId !== 'string' ||
        !value.challengeId || typeof value.nonce !== 'string' || !value.nonce) {
      throw new AuthApiError(RESPONSE_MESSAGE, 'INVALID_RESPONSE');
    }
    return { success: true, challengeId: value.challengeId, nonce: value.nonce };
  });
}

export function loginWithApple(payload: { identityToken: string; challengeId: string; displayName?: string; preview?: boolean }): Promise<SessionSuccessResponse | UserSuccessResponse> {
  return post('/api/auth/social/apple', payload, (value) => payload.preview ? readUserSuccess(value) : readSessionSuccess(value));
}

export function exchangeSocialCode(
  provider: 'google' | 'facebook',
  payload: { code: string; codeVerifier: string; redirectUri: string; preview?: boolean },
): Promise<SessionSuccessResponse | UserSuccessResponse> {
  return post(`/api/auth/social/${provider}`, payload, (value) => payload.preview ? readUserSuccess(value) : readSessionSuccess(value));
}

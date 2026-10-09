import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AuthApiError, clearBrowserSession, readSessionSuccess, restoreBrowserSession, saveBrowserSession, type SessionSuccessResponse } from './auth-api';
import { isValidEmail, normalizeEmail } from '../utils/validation';

const STORAGE_KEY = 'fittrack.member1.session';
const EMAIL_KEY = 'fittrack.member1.email';
let activeSession: SessionSuccessResponse | null = null;
let loaded = false;
let pending: Promise<unknown> = Promise.resolve();

// A slow restore must never overwrite a later sign-in or resurrect a logged-out user.
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.catch(() => {});
  return result;
}

export async function rememberEmail(email: string | null): Promise<void> {
  const value = isValidEmail(email) ? normalizeEmail(email) : null;
  if (Platform.OS === 'web') {
    if (value) globalThis.localStorage?.setItem(EMAIL_KEY, value);
    else globalThis.localStorage?.removeItem(EMAIL_KEY);
  } else if (value) {
    await SecureStore.setItemAsync(EMAIL_KEY, value);
  } else {
    await SecureStore.deleteItemAsync(EMAIL_KEY);
  }
}

export async function getRememberedEmail(): Promise<string | null> {
  const value = Platform.OS === 'web'
    ? globalThis.localStorage?.getItem(EMAIL_KEY)
    : await SecureStore.getItemAsync(EMAIL_KEY);
  return isValidEmail(value) ? normalizeEmail(value) : null;
}

export function saveAuthSession(response: SessionSuccessResponse, { rememberMe = true } = {}): Promise<void> {
  return serialize(async () => {
    const session = readSessionSuccess(response);
    if (Date.parse(session.session.expiresAt) <= Date.now()) {
      throw new Error('Your session has expired. Please log in again.');
    }
    if (Platform.OS === 'web') {
      // Bearer tokens never enter browser localStorage or URL parameters.
      if (rememberMe) await saveBrowserSession(session.session.accessToken);
      else await clearBrowserSession();
    } else if (rememberMe) {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
    await rememberEmail(rememberMe ? session.user.email : null);
    activeSession = session;
    loaded = true;
  });
}

export function getAuthSession(): Promise<SessionSuccessResponse | null> {
  return serialize(async () => {
    if (!loaded) {
      if (Platform.OS === 'web') {
        // Static web rendering has no browser cookie or local storage to restore.
        if (typeof window === 'undefined') return null;
        try {
          activeSession = await restoreBrowserSession();
        } catch (error) {
          if (!(error instanceof AuthApiError) || error.status !== 401) throw error;
          activeSession = null;
        }
      } else {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored) {
          try {
            activeSession = readSessionSuccess(JSON.parse(stored));
          } catch {
            await SecureStore.deleteItemAsync(STORAGE_KEY);
            activeSession = null;
          }
        }
      }
      // Migrate older installations that saved a session but never saved its email.
      if (activeSession) await rememberEmail(activeSession.user.email);
      loaded = true;
    }
    if (activeSession && Date.parse(activeSession.session.expiresAt) <= Date.now()) {
      // Email is remembered separately, even when authentication expires.
      if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(STORAGE_KEY);
      activeSession = null;
    }
    return activeSession;
  });
}

export function clearAuthSession(): Promise<void> {
  return serialize(async () => {
    if (Platform.OS === 'web') await clearBrowserSession();
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
    activeSession = null;
    loaded = true;
  });
}

export async function getStartupRoute() {
  const session = await getAuthSession();
  if (session) return session.user.role === 'admin'
    ? '/admin/users' as const
    : '/member1_onboarding_personalization/personalized-plan' as const;
  return await getRememberedEmail()
    ? '/member1_onboarding_personalization/login' as const
    : '/member1_onboarding_personalization' as const;
}

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { readSessionSuccess, type SessionSuccessResponse } from './auth-api';
import { adoptOnboardingDraft } from '../utils/onboarding-draft';
import { authDestination } from './destination';

const STORAGE_KEY = 'fittrack.member1.session';
let activeSession: SessionSuccessResponse | null = null;
let welcomeSessionToken: string | null = null;
export const canShowWelcomePlan = () => !!activeSession && activeSession.user.role !== 'admin' && welcomeSessionToken === activeSession.session.accessToken;
export const finishWelcomePlan = () => { welcomeSessionToken = null; };
export const signedInDestination = () => authDestination({ user: activeSession?.user ?? {}, firstLogin: canShowWelcomePlan() });
const listeners = new Set<() => void>();
export const getSessionSnapshot = () => activeSession;
export function subscribeToSession(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
const notify = () => listeners.forEach(listener => listener());

export async function saveAuthSession(response: SessionSuccessResponse): Promise<void> {
  const session = readSessionSuccess(response);
  await adoptOnboardingDraft(`${session.user.role ?? 'user'}.${session.user.id}`).catch(() => {});
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  // Web sessions stay in memory; no bearer tokens in localStorage or URL params.
  activeSession = session;
  welcomeSessionToken = session.firstLogin === true ? session.session.accessToken : null;
  notify();
}

export async function getAuthSession(): Promise<SessionSuccessResponse | null> {
  if (!activeSession && Platform.OS !== 'web') {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
      try {
        activeSession = readSessionSuccess(JSON.parse(stored));
        notify();
      } catch {
        await clearAuthSession();
      }
    }
  }
  if (activeSession && Date.parse(activeSession.session.expiresAt) <= Date.now()) {
    await clearAuthSession();
  }
  return activeSession;
}

export async function clearAuthSession(): Promise<void> {
  welcomeSessionToken = null;
  activeSession = null;
  notify();
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(STORAGE_KEY);
}

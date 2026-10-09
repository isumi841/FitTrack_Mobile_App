import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { readSessionSuccess, type SessionSuccessResponse } from './auth-api';

const STORAGE_KEY = 'fittrack.member1.session';
let activeSession: SessionSuccessResponse | null = null;

export async function saveAuthSession(response: SessionSuccessResponse): Promise<void> {
  const session = readSessionSuccess(response);
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  // Web sessions stay in memory; no bearer tokens in localStorage or URL params.
  activeSession = session;
}

export async function getAuthSession(): Promise<SessionSuccessResponse | null> {
  if (!activeSession && Platform.OS !== 'web') {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
      try {
        activeSession = readSessionSuccess(JSON.parse(stored));
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
  activeSession = null;
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(STORAGE_KEY);
}

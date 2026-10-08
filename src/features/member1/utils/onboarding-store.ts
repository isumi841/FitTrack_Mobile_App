import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { getSessionSnapshot } from '../auth/session';
const storeKey = () => { const user = getSessionSnapshot()?.user; return user ? `fittrack.member1.onboarding.${user.role ?? 'user'}.${user.id}` : 'fittrack.member1.onboarding.draft'; };

export interface OnboardingData {
  fitnessLevel: string;
  fitnessGoal: string;
  availableTime: string | number;
}

export async function saveOnboardingData(data: Partial<OnboardingData>) {
  const key = storeKey();
  try {
    const existingStr = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(key)
      : await SecureStore.getItemAsync(key);
    const existing = existingStr ? JSON.parse(existingStr) : {};
    const updated = { ...existing, ...data };
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, JSON.stringify(updated));
    else await SecureStore.setItemAsync(key, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save onboarding data', e);
  }
}

export async function getOnboardingData(): Promise<OnboardingData | null> {
  const key = storeKey();
  try {
    const dataStr = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(key)
      : await SecureStore.getItemAsync(key);
    return dataStr ? JSON.parse(dataStr) : null;
  } catch (e) {
    console.error('Failed to get onboarding data', e);
    return null;
  }
}

export async function clearOnboardingData() {
  const key = storeKey();
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.error('Failed to clear onboarding data', e);
  }
}

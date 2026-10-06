import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORE_KEY = 'fittrack.member1.onboarding';

export interface OnboardingData {
  fitnessLevel: string;
  fitnessGoal: string;
  availableTime: string | number;
}

export async function saveOnboardingData(data: Partial<OnboardingData>) {
  try {
    const existingStr = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(STORE_KEY)
      : await SecureStore.getItemAsync(STORE_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : {};
    const updated = { ...existing, ...data };
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(updated));
    else await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save onboarding data', e);
  }
}

export async function getOnboardingData(): Promise<OnboardingData | null> {
  try {
    const dataStr = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(STORE_KEY)
      : await SecureStore.getItemAsync(STORE_KEY);
    return dataStr ? JSON.parse(dataStr) : null;
  } catch (e) {
    console.error('Failed to get onboarding data', e);
    return null;
  }
}

export async function clearOnboardingData() {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(STORE_KEY);
    else await SecureStore.deleteItemAsync(STORE_KEY);
  } catch (e) {
    console.error('Failed to clear onboarding data', e);
  }
}

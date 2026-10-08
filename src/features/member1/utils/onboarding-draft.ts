import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const draftKey = 'fittrack.member1.onboarding.draft';
export async function adoptOnboardingDraft(account: string) {
  const key = `fittrack.member1.onboarding.${account}`;
  if (Platform.OS === 'web') {
    const draft = globalThis.localStorage?.getItem(draftKey);
    if (draft && !globalThis.localStorage?.getItem(key)) globalThis.localStorage?.setItem(key, draft);
    globalThis.localStorage?.removeItem(draftKey);
  } else {
    const draft = await SecureStore.getItemAsync(draftKey);
    if (draft && !await SecureStore.getItemAsync(key)) await SecureStore.setItemAsync(key, draft);
    await SecureStore.deleteItemAsync(draftKey);
  }
}

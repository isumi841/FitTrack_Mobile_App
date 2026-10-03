/**
 * Member 4 – Expo Router stack layout.
 * This is a nested stack inside the app router.
 * It does NOT modify the global _layout.tsx.
 */
import { Stack } from 'expo-router';

export default function Member4Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

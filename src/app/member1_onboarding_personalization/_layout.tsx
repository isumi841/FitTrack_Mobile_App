/**
 * Member 1 — Onboarding & Personalization sub-navigator
 * This feature owns its theme so existing modules keep their appearance.
 */
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '@/features/member1/constants/theme';

function Member1Stack() {
  const t = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.background },
        animation: 'slide_from_right',
      }}
    />
  );
}

export default function Member1Layout() {
  return <ThemeProvider><Member1Stack /></ThemeProvider>;
}

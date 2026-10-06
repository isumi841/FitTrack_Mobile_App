/**
 * Member 1 — Onboarding & Personalization sub-navigator
 * The application-level theme context is provided by the root layout.
 */
import { Stack } from 'expo-router';
import { useTheme } from '@/constants/theme';

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
  return <Member1Stack />;
}

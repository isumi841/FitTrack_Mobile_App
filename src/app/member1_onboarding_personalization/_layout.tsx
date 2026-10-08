/**
 * Member 1 — Onboarding & Personalization sub-navigator
 * The application-level theme context is provided by the root layout.
 */
import { Redirect, Stack, usePathname } from 'expo-router';
import { useTheme } from '@/features/member1/theme';
import { useAuth } from '@/features/member1/auth/provider';

function Member1Stack() {
  const t = useTheme();
  const { session } = useAuth();
  const path = usePathname();
  if (session && ['/member1_onboarding_personalization', '/member1_onboarding_personalization/login', '/member1_onboarding_personalization/signup', '/member1_onboarding_personalization/verify-email'].includes(path)) {
    return <Redirect href={session.user.role === 'admin' ? '/admin' : '/member1_onboarding_personalization/personalized-plan'} />;
  }

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

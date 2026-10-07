import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from '@/constants/theme';

// Prevent splash screen from auto-hiding until we are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const t = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: 'fade',
        }}>
        {/* Root welcome screen */}
        <Stack.Screen name="index" />
        {/* Member 1 — Onboarding & Personalization */}
        <Stack.Screen name="member1_onboarding_personalization" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

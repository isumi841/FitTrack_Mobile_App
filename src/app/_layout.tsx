import '@/global.css';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FITTRACK_COLORS as C } from '@/constants/fittrack-theme';
import { WorkoutProvider } from '@/features/workout/store';
import { DiscoveryProvider } from '@/features/discovery/store';
import { AdminProvider } from '@/features/exercises/admin-store';
import { AuthProvider, useAuth } from '@/features/member1/auth/provider';
import { ThemeProvider as OnboardingThemeProvider } from '@/features/member1/theme';
import type { ReactNode } from 'react';
import { MobileViewport } from '@/components/layout/mobile-viewport';
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: C.accent, background: C.bg, card: C.surface, text: C.text, border: C.border, notification: C.accent } };
// Shared providers preserve the current session when moving between selection and guidance.
export default function RootLayout() {
  useEffect(() => { void SplashScreen.hideAsync(); }, []);
  return <MobileViewport><SafeAreaProvider><AuthProvider><OnboardingThemeProvider><AccountProviders><ThemeProvider value={theme}><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} /></ThemeProvider></AccountProviders></OnboardingThemeProvider></AuthProvider></SafeAreaProvider></MobileViewport>;
}
function AccountProviders({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth();
  if (!ready) return null;
  const account = session ? `${session.user.role ?? 'user'}:${session.user.id}` : 'signed-out';
  return <WorkoutProvider key={account}><DiscoveryProvider><AdminProvider>{children}</AdminProvider></DiscoveryProvider></WorkoutProvider>;
}

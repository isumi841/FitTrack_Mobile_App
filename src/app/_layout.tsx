import '@/global.css';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FITTRACK_COLORS as C } from '@/constants/fittrack-theme';
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: C.accent, background: C.bg, card: C.surface, text: C.text, border: C.border, notification: C.accent } };
// Member 3 preview integration. See README before merging this shared file.
export default function RootLayout() {
  useEffect(() => { void SplashScreen.hideAsync(); }, []);
  return <SafeAreaProvider><ThemeProvider value={theme}><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} /></ThemeProvider></SafeAreaProvider>;
}

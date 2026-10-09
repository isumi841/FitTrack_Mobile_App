import { Stack, usePathname } from 'expo-router';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppBottomNav } from './app-bottom-nav';

/** One navigation shell for every feature, on iOS, Android, and web. */
export default function AppNavigation() {
  const pathname = usePathname();
  const member1Screen = pathname.startsWith('/member1_onboarding_personalization');
  const member1AppScreen = [
    '/member1_onboarding_personalization/personalized-plan',
    '/member1_onboarding_personalization/workout-session',
  ].includes(pathname);
  const showBottomNav = !pathname.startsWith('/admin') && (!member1Screen || member1AppScreen);
  const dark = useColorScheme() === 'dark';
  const reducedMotion = useReducedMotion();
  const backgroundColor = dark ? '#0D1117' : '#F5F7FA';

  return (
    <View style={[styles.viewport, { backgroundColor: dark ? '#080C0D' : '#E8ECE6' }]}>
      <View style={[styles.app, { backgroundColor }]}>
        <View style={styles.screens}>
          <Stack screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'fade', contentStyle: { backgroundColor } }} />
        </View>
        {showBottomNav && <AppBottomNav />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, width: '100%', alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 440 : undefined, overflow: 'hidden' },
  screens: { flex: 1, minHeight: 0 },
});

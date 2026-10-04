import { Stack, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { AppBottomNav } from '@/components/navigation/app-bottom-nav';
import { c, s } from '@/features/workout/ui';
import { WorkoutProvider, useWorkout } from '../../features/workout/store';
function Navigator() {
  const { ready, data, pause } = useWorkout();
  const path = usePathname();
  const previousPath = useRef(path);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const leftSession = ['/workout/active', '/workout/timer'].includes(previousPath.current);
    previousPath.current = path;
    if (leftSession && data.session?.status === 'running' && !['/workout/active', '/workout/timer'].includes(path)) pause();
  }, [path, data.session?.status, pause]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center', gap: 12 }}><ActivityIndicator color={c.accent} /><Text style={s.body}>Loading your workout…</Text></View>;
  return <KeyboardAvoidingView style={s.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} enabled={Platform.OS !== 'web'}>
    <View style={s.shell}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: reducedMotion ? 'none' : 'fade', contentStyle: { backgroundColor: c.bg } }} />
      <AppBottomNav onBeforeNavigate={pause} />
    </View>
  </KeyboardAvoidingView>;
}
export default function Layout() { return <WorkoutProvider><Navigator /></WorkoutProvider>; }

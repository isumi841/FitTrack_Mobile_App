import { Stack, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WorkoutProvider, useWorkout } from '../../features/workout/store';
function Navigator() {
  const { ready, data, pause } = useWorkout();
  const path = usePathname();
  const previousPath = useRef(path);
  useEffect(() => {
    const leftSession = ['/workout/active', '/workout/timer'].includes(previousPath.current);
    previousPath.current = path;
    if (leftSession && data.session?.status === 'running' && !['/workout/active', '/workout/timer'].includes(path)) pause();
  }, [path, data.session?.status, pause]);
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}><ActivityIndicator color="#107E78" /><Text>Loading your workout…</Text></View>;
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade', contentStyle: { backgroundColor: '#F5F8FC' } }} />;
}
export default function Layout() { return <WorkoutProvider><Navigator /></WorkoutProvider>; }

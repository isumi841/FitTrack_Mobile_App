import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { AppBottomNav } from '@/components/navigation/app-bottom-nav';
import { useWorkout } from '@/features/workout/store';
import { c, s } from '@/features/workout/ui';

export default function DiscoveryLayout() {
  const { pause } = useWorkout();
  const reducedMotion = useReducedMotion();
  return <View style={s.safe}><View style={s.shell}>
    <Stack screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'fade', contentStyle: { backgroundColor: c.bg } }} />
    <AppBottomNav onBeforeNavigate={pause} />
  </View></View>;
}

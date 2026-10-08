import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/features/member1/auth/provider';
import { Member4ProfileProvider } from '@/features/member4/context/Member4ProfileContext';
import { Member4ActivityProvider } from '@/features/member4/context/Member4Activity';
import { Member4Alerts } from '@/features/member4/context/Member4Alerts';
import { AppBottomNav } from '@/components/navigation/app-bottom-nav';
import { useWorkout } from '@/features/workout/store';
export default function Member4Layout() {
  const { session, ready } = useAuth();
  const { pause } = useWorkout();
  if (!ready) return null;
  if (!session) return <Redirect href="/member1_onboarding_personalization/login" />;
  if (session.user.role === 'admin') return <Redirect href="/admin" />;
  return <Member4Alerts><Member4ProfileProvider key={session.user.id}><Member4ActivityProvider>
    <View style={{ flex: 1, backgroundColor: '#0e1317' }}><Stack screenOptions={{ headerShown: false }} /><AppBottomNav onBeforeNavigate={pause} /></View>
  </Member4ActivityProvider></Member4ProfileProvider></Member4Alerts>;
}

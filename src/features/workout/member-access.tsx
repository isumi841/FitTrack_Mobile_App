import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '@/features/member1/auth/provider';
import { Badge, Button, Card, s } from './ui';
export function MemberAccess() {
  const { session } = useAuth();
  if (session?.user.role === 'admin') return <Card><Text style={s.body}>You are signed in as an administrator.</Text><Button title="Open admin dashboard" onPress={() => router.replace('/admin')} /></Card>;
  if (session) return <View style={s.row}><View style={{ flex: 1 }}><Text style={s.smallStrong}>{session.user.displayName || session.user.email || 'Your account'}</Text><Text style={s.body}>Your workout progress is saved to this account.</Text></View><Badge>SIGNED IN</Badge></View>;
  return <Card><Text style={s.heading}>Make every session yours</Text><Text style={s.body}>Log in to save your progress and resume workouts across sessions.</Text>
    <Button title="Log in" onPress={() => router.push('/member1_onboarding_personalization/login')} />
    <Button title="Create an account" secondary onPress={() => router.push('/member1_onboarding_personalization/signup')} />
  </Card>;
}

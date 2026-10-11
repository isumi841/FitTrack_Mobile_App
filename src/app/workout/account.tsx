import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { useAuth } from '@/features/member1/auth/provider';
import { MemberAccess } from '@/features/workout/member-access';
import { useWorkout } from '@/features/workout/store';
import { Button, Card, Page, s } from '@/features/workout/ui';
export default function Account() {
  const { session, logout } = useAuth();
  const { prepareSignOut, busy, pending } = useWorkout();
  const [message, setMessage] = useState('');
  return <Page title="Your account"><MemberAccess />
    {session && <>
      <Card><Text style={s.heading}>Your FitTrack</Text>
        <Button title="Workout history" secondary onPress={() => router.push('/workout/sessions')} />
        <Button title="Workout preferences" secondary onPress={() => router.push('/member1_onboarding_personalization/fitness-level')} />
        <Button title="Notifications" secondary onPress={() => router.push('/workout/notifications')} />
      </Card>
      {!!message && <Text accessibilityRole="alert" style={s.body}>{message}</Text>}
      <Button title="Log out" danger disabled={busy || pending} onPress={async () => {
        if (!await prepareSignOut()) { setMessage('Please finish saving your workout before logging out.'); return; }
        try { await logout(); router.replace('/member1_onboarding_personalization/login'); }
        catch { setMessage('Unable to clear saved sign-in. Please try again.'); }
      }} />
    </>}
  </Page>;
}

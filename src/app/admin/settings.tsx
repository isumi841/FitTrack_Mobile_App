import { useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '@/features/member1/auth/provider';
import { Button, Card, Page, s } from '@/features/workout/ui';

export default function AdminSettings() {
  const { session, logout } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function signOut() {
    setBusy(true);
    try { await logout(); router.replace('/member1_onboarding_personalization/login'); }
    catch { setError('Unable to finish signing out. Please try again.'); }
    finally { setBusy(false); }
  }
  return <Page title="Settings" scope="admin" back={false}>
    <Card><Text style={s.heading}>Account</Text><Text style={s.body}>{session?.user.email}</Text>
      {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
      {confirm ? <><Text style={s.body}>Log out of the admin dashboard?</Text><Button title={busy ? 'Logging out…' : 'Confirm logout'} danger disabled={busy} onPress={() => { void signOut(); }} /><Button title="Cancel" secondary disabled={busy} onPress={() => setConfirm(false)} /></>
        : <Button title="Log out" danger onPress={() => setConfirm(true)} />}
    </Card>
  </Page>;
}

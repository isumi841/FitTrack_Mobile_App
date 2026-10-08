import { useState } from 'react';
import { router } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { useAdmin } from '@/features/exercises/admin-store';
import { adminSignup } from '@/features/member1/auth/auth-api';
import { Button, Card, Page, c, s } from '@/features/workout/ui';

export default function AdminSignup() {
  const { token } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function create() {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      await adminSignup({ email, password }, token);
      setPassword(''); setEmail(''); setMessage('Administrator created. Your current account is still signed in.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create administrator.'); }
    finally { setBusy(false); }
  }
  return <Page title="Create administrator" scope="admin" onBack={() => router.replace('/admin/users')}>
    <Card><Text style={s.heading}>Administrator access</Text><Text style={s.body}>Create an account for a team member who needs access to the admin dashboard.</Text>
      <Text style={s.smallStrong}>Email</Text><TextInput accessibilityLabel="Administrator email" style={s.input} placeholder="Email address" placeholderTextColor={c.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!busy} />
      <Text style={s.smallStrong}>Password</Text><TextInput accessibilityLabel="Administrator password" style={s.input} value={password} onChangeText={setPassword} secureTextEntry editable={!busy} />
      <Text style={s.body}>Use at least 8 characters, including uppercase, lowercase, a number and a symbol.</Text>
      {!!message && <Text accessibilityRole="alert" style={s.body}>{message}</Text>}
      <Button title={busy ? 'Creating…' : 'Create administrator'} disabled={busy || !email.trim() || !password} onPress={() => { void create(); }} />
    </Card>
  </Page>;
}

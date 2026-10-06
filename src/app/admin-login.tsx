import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { useAdmin, type AdminSession } from '@/features/exercises/admin-store';
import { api } from '@/features/workout/api';
import { Button, Card, Page, s } from '@/features/workout/ui';

export default function AdminLogin() {
  const { token, setSession } = useAdmin();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function login() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const result = await api<AdminSession>('/admin/login', '', 'POST', { username: username.trim(), password });
      if (!mounted.current) { void api('/admin/logout', result.token, 'POST').catch(() => {}); return; }
      setPassword(''); setSession(result);
      router.replace('/admin');
    } catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Login failed. Please retry.'); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  if (__DEV__ && token) return <Redirect href="/admin" />;
  return <KeyboardAvoidingView style={s.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} enabled={Platform.OS !== 'web'}><View style={s.shell}>
    <Page scope="admin" title="Admin login" onBack={() => { if (!busy) router.replace('/member2/workout'); }}>
      <Text style={s.title}>Welcome, admin.</Text>
      <Text style={s.body}>Sign in to open the dashboard and manage exercise instructions.</Text>
      {__DEV__ ? <Card>
        <Text style={s.smallStrong}>Username</Text><TextInput accessibilityLabel="Admin username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} editable={!busy} style={s.input} />
        <Text style={s.smallStrong}>Password</Text><TextInput accessibilityLabel="Admin password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy} style={s.input} returnKeyType="go" onSubmitEditing={() => { if (password && username.trim()) void login(); }} />
        {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
        <Button title={busy ? 'Signing in…' : 'Log in to dashboard'} disabled={busy || !username.trim() || !password} onPress={() => { void login(); }} />
        <Text style={s.body}>Temporary local access: username admin; password is the private ADMIN_DEV_TOKEN configured in your backend. Sessions last one hour.</Text>
      </Card> : <Text style={s.body}>Temporary login is disabled in release builds. Team authentication will be connected here.</Text>}
    </Page>
  </View></KeyboardAvoidingView>;
}

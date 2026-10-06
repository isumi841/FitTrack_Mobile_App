import { Redirect, Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Text } from 'react-native';
import { useAdmin } from '@/features/exercises/admin-store';
import { useResource } from '@/features/workout/resources';
import { Button, Card, Page, s } from '@/features/workout/ui';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ADMIN_COLORS } from '@/constants/admin-theme';

export default function Layout() {
  const { token, logout } = useAdmin();
  const access = useResource<{ admin: boolean }>(token ? '/admin/access' : null, token);
  const retry = access.retry;
  useFocusEffect(useCallback(() => { retry(); }, [retry]));
  if (!__DEV__ || !token) return <Redirect href="/admin-login" />;
  if (!access.value?.admin) return <Page scope="admin" title="Admin dashboard">
    {access.loading ? <Text style={s.body}>Checking admin access…</Text> : <Card><Text accessibilityRole="alert" style={s.body}>{access.error}</Text><Button title="Retry access" onPress={retry} /><Button title="Return to login" secondary onPress={() => { void logout(); }} /></Card>}
  </Page>;
  return <AdminLayout><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ADMIN_COLORS.dark.background } }} /></AdminLayout>;
}

import { router, useFocusEffect } from 'expo-router';
import { Text } from 'react-native';
import { useCallback } from 'react';
import { useWorkout } from '@/features/workout/store';
import { useResource } from '@/features/workout/resources';
import { isFinished, type Session } from '@/features/workout/engine';
import { DevelopmentIdentity } from '@/features/workout/development-identity';
import { Badge, Button, Card, Page, s } from '@/features/workout/ui';
export default function Sessions() {
  const { token, loadSession, busy, pending } = useWorkout();
  const { value, loading, error, retry } = useResource<{ sessions: Session[] }>('/workout-sessions', token);
  useFocusEffect(useCallback(() => { retry(); }, [retry]));
  return <Page title="Member 3 session history">
    <Text style={s.body}>Backend records for this identity. Unfinished sessions reopen paused. This testing history is separate from the team dashboard.</Text>
    <DevelopmentIdentity />
    <Button title="Refresh sessions" secondary onPress={retry} />
    {loading && <Text style={s.body}>Loading sessions…</Text>}
    {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
    {!loading && !error && !value?.sessions.length && <Text style={s.body}>No saved sessions yet.</Text>}
    {value?.sessions.map(session => <Card key={session.id}><Badge>{session.status}</Badge><Text style={s.heading}>{session.snapshot.name}</Text>
      <Text style={s.body}>{new Date(session.startedAt).toLocaleString()} · {session.completedSets} completed · {session.skippedSets} skipped</Text>
      <Button title={isFinished(session) ? 'Open saved summary' : 'Restore paused workout'} disabled={busy || pending} onPress={async () => {
        if (await loadSession(session.id)) router.push(isFinished(session) ? { pathname: '/workout/completed', params: { session: session.id } } : '/workout/pause');
      }} />
    </Card>)}
    <Button title="Browse samples" onPress={() => router.replace('/workout/browse')} />
  </Page>;
}

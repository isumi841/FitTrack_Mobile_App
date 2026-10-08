import { router, useFocusEffect } from 'expo-router';
import { Text } from 'react-native';
import { useCallback } from 'react';
import { useWorkout } from '@/features/workout/store';
import { useResource } from '@/features/workout/resources';
import { isFinished, type Session } from '@/features/workout/engine';
import { MemberAccess } from '@/features/workout/member-access';
import { Badge, Button, Card, Page, s } from '@/features/workout/ui';
export default function Sessions() {
  const { token, data, loadSession, busy, pending, recordsVersion } = useWorkout();
  const { value, loading, error, retry } = useResource<{ sessions: Session[] }>(token ? `/workout-sessions?refresh=${recordsVersion}` : null, token);
  useFocusEffect(useCallback(() => { retry(); }, [retry]));
  return <Page title="Workout history">
    <Text style={s.title}>Every session counts</Text>
    <Text style={s.body}>Pick up where you left off or look back at a finished workout.</Text>
    <MemberAccess />
    {data.session && !isFinished(data.session) && <Card tinted><Text style={s.heading}>Continue your workout</Text><Text style={s.body}>{data.session.snapshot.name}</Text><Button title="Return to current workout" disabled={busy || pending} onPress={() => router.push(data.session!.status === 'running' ? '/workout/active' : '/workout/pause')} /></Card>}
    {!!token && <Button title="Refresh sessions" secondary icon="refresh" onPress={retry} />}
    {loading && <Text style={s.body}>Loading sessions…</Text>}
    {!!token && !!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
    {!!token && !loading && !error && !value?.sessions.length && <Text style={s.body}>No saved sessions yet. Start a workout to see your progress here.</Text>}
    {value?.sessions.map(session => <Card key={session.id}><Badge>{session.status === 'ended-early' ? 'Ended early' : session.status === 'completed' ? 'Completed' : 'In progress'}</Badge><Text style={s.heading}>{session.snapshot.name}</Text>
      <Text style={s.body}>{new Date(session.startedAt).toLocaleString()} · {session.completedSets} completed · {session.skippedSets} skipped</Text>
      <Button title={isFinished(session) ? 'Open saved summary' : 'Restore paused workout'} disabled={busy || pending} onPress={async () => {
        if (isFinished(session)) router.push({ pathname: '/workout/completed', params: { session: session.id } });
        else if (await loadSession(session.id)) router.push('/workout/pause');
      }} />
    </Card>)}
    <Button title="Explore workouts" onPress={() => router.replace('/member2/workout')} />
  </Page>;
}

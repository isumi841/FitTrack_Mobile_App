import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { formatTime } from '@/features/workout/data';
import { currentIndex, currentRound, isFinished } from '@/features/workout/engine';
import { useWorkout } from '@/features/workout/store';
import { Badge, Button, Card, Figure, Page, Row, s } from '@/features/workout/ui';
export default function PauseResumeScreen() {
  const { data, resume, finish, busy, pending } = useWorkout();
  const [confirm, setConfirm] = useState(false);
  const session = data.session;
  if (!session) return <Redirect href="/workout/sessions" />;
  if (session.status === 'running') return <Redirect href="/workout/active" />;
  if (isFinished(session) && !busy && !pending) return <Redirect href={{ pathname: '/workout/completed', params: { session: session.id } }} />;
  const exercise = session.snapshot.exercises[currentIndex(session)];
  return <Page title="Workout paused" onBack={() => router.replace('/workout/browse')}>
    <Figure id={exercise.id} /><Card><Badge>{isFinished(session) ? 'AWAITING SAVE' : 'WORKOUT PAUSED'}</Badge><Text style={s.title}>{session.snapshot.name}</Text>
      <Row label="Current movement" value={exercise.name} /><Row label="Remaining interval" value={formatTime(Math.ceil(session.remainingMs / 1000))} />
      <Row label="Round" value={`${currentRound(session)} of ${session.snapshot.rounds}`} /><Row label="Phase" value={session.phase % 2 ? 'Recovery' : 'Movement'} />
      <Button title="Resume workout" disabled={busy || pending || isFinished(session)} onPress={async () => { if (await resume()) router.replace('/workout/active'); }} />
      <Button title="End workout early" danger disabled={busy || pending || isFinished(session)} onPress={() => setConfirm(true)} />
      {confirm && <Card><Text style={s.body}>End this session and save its completed activity?</Text><Button title="End and save session" danger disabled={busy || pending} onPress={() => { void finish(); }} /><Button title="Keep paused" secondary onPress={() => setConfirm(false)} /></Card>}
    </Card>
  </Page>;
}

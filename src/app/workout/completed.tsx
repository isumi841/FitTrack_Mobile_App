import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { formatTime } from '@/features/workout/data';
import { isFinished, totalSets } from '@/features/workout/engine';
import { useWorkout } from '@/features/workout/store';
import { DevelopmentIdentity } from '@/features/workout/development-identity';
import { Button, Card, Page, Row, s } from '@/features/workout/ui';
export default function WorkoutCompletedScreen() {
  const params = useLocalSearchParams<{ session?: string }>();
  const { data, token, loadSession, busy } = useWorkout();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!params.session) return;
    void loadSession(params.session);
  }, [params.session, token, loadSession, attempt]);
  const session = data.session?.id === params.session ? data.session : null;
  if (!session || !isFinished(session)) return <Page title="Session summary"><DevelopmentIdentity /><Text style={s.body}>{busy ? 'Loading saved summary…' : 'Choose a completed or ended session from history.'}</Text><Button title="Retry summary" disabled={busy} onPress={() => setAttempt(n => n + 1)} /><Button title="Session history" onPress={() => router.replace('/workout/sessions')} /></Page>;
  return <Summary key={session.id} />;
}
function Summary() {
  const { data, updateSummary, deleteSummary, busy, pending } = useWorkout();
  const session = data.session!;
  const [note, setNote] = useState(session.note);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return <Page title="Saved session summary" onBack={() => router.replace('/workout/sessions')}>
    <Text style={s.title}>{session.status === 'completed' ? 'Workout finished' : 'Session ended early'}</Text>
    <Card><Text style={s.heading}>{session.snapshot.name}</Text><Row label="Active duration (including recovery)" value={formatTime(Math.floor(session.elapsedMs / 1000))} /><Row label="Completed sets" value={`${session.completedSets} of ${totalSets(session)}`} /><Row label="Skipped sets" value={String(session.skippedSets)} /><Row label="Status" value={session.status} /><Row label="Date" value={new Date(session.startedAt).toLocaleString()} /><Row label="Revision" value={String(session.revision)} /></Card>
    <Card><Text style={s.heading}>How did it feel?</Text><TextInput accessibilityLabel="Session note" value={note} onChangeText={value => { setNote(value); setSaved(false); }} multiline maxLength={500} style={s.input} />
      <Button title={saved ? 'Note saved to backend' : 'Save session note'} disabled={busy || pending} onPress={async () => { setSaved(await updateSummary(session.id, note)); }} />
    </Card>
    <Button title="Delete this session record" danger disabled={busy || pending} onPress={() => setConfirm(true)} />
    {confirm && <Card><Text style={s.body}>Permanently delete only this saved session? The catalog workout remains available.</Text><Button title="Confirm delete" danger disabled={busy || pending} onPress={async () => { if (await deleteSummary(session.id)) router.replace('/workout/sessions'); }} /><Button title="Cancel" secondary onPress={() => setConfirm(false)} /></Card>}
    <Button title="Session history" secondary onPress={() => router.replace('/workout/sessions')} /><Button title="Browse workouts" secondary onPress={() => router.replace('/workout/browse')} />
  </Page>;
}

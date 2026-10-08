import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { NavigationIcon } from '@/components/navigation/navigation-icon';
import { formatTime } from '@/features/workout/data';
import { isFinished, totalSets, type Session } from '@/features/workout/engine';
import { useResource } from '@/features/workout/resources';
import { useWorkout } from '@/features/workout/store';
import { MemberAccess } from '@/features/workout/member-access';
import { Badge, Button, Card, Page, Row, c, s } from '@/features/workout/ui';
export default function WorkoutCompletedScreen() {
  const params = useLocalSearchParams<{ session?: string }>();
  const { token, recordsVersion } = useWorkout();
  const { value, loading, error, retry } = useResource<{ session: Session }>(token && params.session ? `/workout-sessions/${encodeURIComponent(params.session)}?refresh=${recordsVersion}` : null, token);
  const session = value?.session;
  if (!session || !isFinished(session)) return <Page title="Session summary"><MemberAccess /><Text accessibilityRole={error && token ? 'alert' : undefined} style={s.body}>{loading ? 'Loading saved summary…' : token && error ? error : 'Choose a completed or ended session from history.'}</Text><Button title="Retry summary" disabled={loading || !token} onPress={retry} /><Button title="Session history" onPress={() => router.replace('/workout/sessions')} /></Page>;
  return <Summary key={`${session.id}:${session.revision}`} session={session} />;
}
function Summary({ session }: { session: Session }) {
  const { data, updateSummary, deleteSummary, busy, pending } = useWorkout();
  const [note, setNote] = useState(session.note);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return <Page title="Workout summary" onBack={() => router.replace('/workout/sessions')}>
    <Card tinted><View style={s.brandMark}><NavigationIcon name="check" color={c.accent} size={26} /></View><Badge>SESSION SAVED</Badge>
      <Text style={s.title}>{session.status === 'completed' ? 'Workout finished' : 'Progress worth keeping'}</Text>
      <Text style={s.body}>{session.status === 'completed' ? 'Take a moment to recover. Your session is ready to review.' : 'You ended this workout early. Your completed activity is saved.'}</Text>
    </Card>
    <Card><Text style={s.heading}>{session.snapshot.name}</Text><Row label="Session time" value={formatTime(Math.floor(session.elapsedMs / 1000))} /><Row label="Completed exercises" value={`${session.completedSets} of ${totalSets(session)}`} /><Row label="Skipped exercises" value={String(session.skippedSets)} /><Row label="Rounds planned" value={String(session.snapshot.rounds)} /><Row label="Date" value={new Date(session.startedAt).toLocaleString()} /><Text style={s.body}>Session time includes recovery breaks and excludes paused time.</Text></Card>
    <Card><Text style={s.heading}>How did it feel?</Text><TextInput accessibilityLabel="Session note" value={note} onChangeText={value => { setNote(value); setSaved(false); }} multiline maxLength={500} style={s.input} />
      <Text style={s.body}>{note.length}/500 characters</Text>
      <Button title={saved || note === session.note ? 'Note saved' : 'Save session note'} disabled={busy || pending || note === session.note} onPress={async () => { setSaved(await updateSummary(session, note)); }} />
    </Card>
    <Button title="Delete this session record" danger disabled={busy || pending} onPress={() => setConfirm(true)} />
    {confirm && <Card><Text style={s.body}>Permanently delete only this saved session? The catalog workout remains available.</Text><Button title="Confirm delete" danger disabled={busy || pending} onPress={async () => { if (await deleteSummary(session)) router.replace('/workout/sessions'); }} /><Button title="Cancel" secondary disabled={busy} onPress={() => setConfirm(false)} /></Card>}
    <Card><Text style={s.heading}>Exercise results</Text>
      {session.snapshot.exercises.map((exercise, index) => {
        const rounds = Array.from({ length: session.snapshot.rounds }, (_, round) => {
          const interval = (round * session.snapshot.exercises.length + index) * 2;
          return session.completedIntervals.includes(interval) ? 'Completed' : session.skippedIntervals.includes(interval) ? 'Skipped' : 'Not completed';
        });
        return <View key={exercise.id} style={{ gap: 4 }}><Text style={s.smallStrong}>{index + 1}. {exercise.name}</Text><Text style={s.body}>{rounds.map((result, round) => session.snapshot.rounds > 1 ? `Round ${round + 1}: ${result}` : result).join(' · ')}</Text></View>;
      })}
    </Card>
    {data.session && !isFinished(data.session) && <Button title="Return to current workout" onPress={() => router.replace('/workout/pause')} />}
    <Button title="Session history" secondary onPress={() => router.replace('/workout/sessions')} /><Button title="Explore workouts" secondary onPress={() => router.replace('/member2/workout')} />
  </Page>;
}

import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationIcon } from '@/components/navigation/navigation-icon';
import { formatTime } from './data';
import { currentIndex, currentRound, totalSets, isFinished, manualMovement, phaseSeconds } from './engine';
import { useWorkout } from './store';
import { Badge, Button, Card, Clock, Page, c, s } from './ui';

export function SessionScreen({ timer = false }: { timer?: boolean }) {
  const { data, pause, skip, complete, busy, pending, error } = useWorkout();
  const session = data.session;
  if (!session) return <Redirect href="/workout/sessions" />;
  if (isFinished(session) && (busy || pending || error)) return <Page title="Finishing workout"><Text style={s.body}>Saving your progress. Your summary will open when it is ready.</Text></Page>;
  if (isFinished(session)) return <Redirect href={{ pathname: '/workout/completed', params: { session: session.id } }} />;
  if (session.status === 'paused') return <Redirect href="/workout/pause" />;
  const index = currentIndex(session);
  const exercises = session.snapshot.exercises;
  const total = totalSets(session);
  const exercise = exercises[index];
  const rest = session.phase % 2 === 1;
  const manual = manualMovement(session);
  const finishedSets = session.completedSets + session.skippedSets;
  const pauseScreen = () => { pause(); router.replace('/workout/pause'); };
  return <Page title={timer ? 'Workout timer' : 'Active workout'} onBack={pauseScreen} showSaving={false}>
    <View style={s.row}><Badge>ROUND {currentRound(session)} / {session.snapshot.rounds}</Badge>
      <View style={styles.elapsed}><NavigationIcon name="timer" size={16} color={c.muted} /><Text style={s.smallStrong}>{formatTime(session.elapsedMs / 1000)}</Text></View>
    </View>
    <View style={{ gap: 8 }}><View style={s.row}><Text numberOfLines={1} style={[s.smallStrong, { flex: 1 }]}>{session.snapshot.name}</Text><Text style={s.body}>{finishedSets}/{total}</Text></View>
      <View accessibilityRole="progressbar" accessibilityLabel="Workout progress" accessibilityValue={{ min: 0, max: total, now: finishedSets }} style={styles.track}>
        <View style={[styles.fill, { width: `${finishedSets / total * 100}%` }]} />
      </View>
    </View>
    <View style={styles.focus}>
      <Text style={s.label}>{rest ? 'RECOVERY' : `EXERCISE ${index + 1} OF ${exercises.length}`}</Text>
      <Text accessibilityRole="header" style={[s.title, styles.center]}>{rest ? 'Take a breath' : exercise.name}</Text>
      <Text style={[s.body, styles.center]}>{rest ? 'Relax and prepare for your next movement.' : exercise.subtitle || exercise.cue || 'Move at a comfortable pace and focus on your form.'}</Text>
      {manual ? <View style={styles.manual}><Text style={[s.digits, styles.center, { fontSize: 36 }]}>{exercise.target || 'Your pace'}</Text><Text style={[s.body, styles.center]}>Tap complete when you finish the target.</Text></View>
        : <Clock remaining={session.remainingMs / 1000} total={phaseSeconds(session) ?? 0} />}
      {manual && <Button title="Complete exercise" icon="check" disabled={busy || pending} onPress={() => { void complete(); }} />}
    </View>
    <View style={s.row}><View style={{ flex: 1 }}><Button title="Pause workout" secondary onPress={pauseScreen} /></View>
      <View style={{ flex: 1 }}><Button title={rest ? 'Skip rest' : 'Skip exercise'} secondary disabled={busy || pending} onPress={() => { void skip(); }} /></View></View>
    {!rest && !timer && <Button title="Instructions & video" icon="guide" secondary onPress={() => {
      pause(); router.push({ pathname: '/workout/instructions', params: { exercise: exercise.id, sessionId: session.id } });
    }} />}
    <Card><View style={s.row}><View style={{ flex: 1, gap: 5 }}><Text style={s.label}>UP NEXT</Text>
      <Text style={s.heading}>{session.phase >= (total - 1) * 2 ? 'Your workout summary' : exercises[(index + 1) % exercises.length].name}</Text>
      <Text style={s.body}>{session.completedSets} completed · {session.skippedSets} skipped</Text></View><NavigationIcon name="next" color={c.accent} /></View></Card>
    <Button title={timer ? 'Back to guided view' : 'Focus timer'} icon="timer" secondary onPress={() => router.replace(timer ? '/workout/active' : '/workout/timer')} />
    <Button title="End workout" danger onPress={pauseScreen} />
  </Page>;
}
const styles = StyleSheet.create({
  elapsed: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  track: { height: 6, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 4, backgroundColor: c.accent },
  focus: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 16, gap: 10 },
  center: { textAlign: 'center' }, manual: { paddingVertical: 24, gap: 10 },
});

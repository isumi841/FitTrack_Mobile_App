import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationIcon } from '@/components/navigation/navigation-icon';
import { MemberAccess } from '@/features/workout/member-access';
import { type Workout, formatTime } from '@/features/workout/data';
import { isFinished } from '@/features/workout/engine';
import { useResource } from '@/features/workout/resources';
import { useWorkout } from '@/features/workout/store';
import { Badge, Button, Card, Page, c, s } from '@/features/workout/ui';

export default function StartWorkout() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { value, loading, error, retry } = useResource<{ workout: Workout }>(workoutId ? `/workouts/${encodeURIComponent(workoutId)}/session-plan` : null);
  return <Page title="Get ready" onBack={() => workoutId ? router.replace({ pathname: '/workout/details', params: { workoutId } }) : router.replace('/member2/workout')}>
    {loading && <Text style={s.body}>Preparing your workout…</Text>}
    {!!error && <Card><Text style={s.heading}>Workout unavailable</Text><Text accessibilityRole="alert" style={s.body}>{error}</Text><Button title="Try again" secondary onPress={retry} /></Card>}
    {value && <Setup key={value.workout.id} workout={value.workout} />}
  </Page>;
}
function Setup({ workout }: { workout: Workout }) {
  const { data, token, start, busy, pending, recoveryFailed } = useWorkout();
  const [rounds, setRounds] = useState(workout.rounds);
  const [rest, setRest] = useState(workout.restSeconds);
  const unfinished = data.session && !isFinished(data.session);
  const manual = workout.exercises.some(exercise => exercise.durationSeconds === null);
  const timedSeconds = workout.exercises.reduce((sum, exercise) => sum + (exercise.durationSeconds === undefined ? workout.workSeconds : exercise.durationSeconds ?? 0), 0) * rounds;
  const totalSeconds = timedSeconds + (workout.exercises.length * rounds - (workout.managed ? 1 : 0)) * rest;
  return <>
    <View style={styles.hero}>
      <Badge>YOUR NEXT SESSION</Badge>
      <Text style={s.title}>{workout.name}</Text>
      <Text style={s.body}>{workout.description}</Text>
      <View style={styles.stats}>
        <View style={styles.stat}><NavigationIcon name="workouts" color={c.accent} /><Text style={s.heading}>{workout.exercises.length}</Text><Text style={s.body}>exercises</Text></View>
        <View style={styles.stat}><NavigationIcon name="timer" color={c.accent} /><Text style={s.heading}>{manual ? 'Your pace' : formatTime(totalSeconds)}</Text><Text style={s.body}>{manual ? 'manual + timed' : 'session time'}</Text></View>
      </View>
    </View>
    <MemberAccess />
    {unfinished ? <Card tinted><Text style={s.heading}>You have a workout in progress</Text><Text style={s.body}>{data.session!.snapshot.name}</Text>
      <Button title="Return to current workout" icon="play" disabled={busy || pending} onPress={() => router.replace(data.session!.status === 'paused' ? '/workout/pause' : '/workout/active')} />
      <Text style={s.body}>Finish or end this session before starting another.</Text></Card> : <>
      <Card><Text style={s.heading}>Make it your session</Text>
        <Text style={s.smallStrong}>Rounds</Text><Choices values={[1, 2, 3, 4, 5]} value={rounds} onChange={setRounds} label={n => `${n}`} disabled={busy || pending} />
        <Text style={s.smallStrong}>Rest between exercises</Text><Choices values={[10, 20, 30, 60]} value={rest} onChange={setRest} label={n => `${n}s`} disabled={busy || pending} />
        <Text style={s.body}>Timed exercises advance automatically. For rep-based exercises, finish the target and tap Complete exercise. You can pause at any time.</Text>
      </Card>
      <Button title={busy ? 'Preparing session…' : 'Start workout'} icon="play" disabled={!token || busy || pending || recoveryFailed} onPress={async () => {
        if (await start(workout, { rounds, restSeconds: rest })) router.replace('/workout/active');
      }} />
      {!token && <Text style={s.body}>Sign in above to start saving your progress.</Text>}
    </>}
    <Text style={s.heading}>Your exercise plan</Text>
    {workout.exercises.map((exercise, index) => <Card key={exercise.id}><View style={s.row}>
      <Text style={s.number}>{index + 1}</Text><View style={{ flex: 1, gap: 4 }}><Text style={s.smallStrong}>{exercise.name}</Text>
        <Text style={s.body}>{exercise.target ?? `${workout.workSeconds}s`}{exercise.durationSeconds === null ? ' · Complete at your pace' : ' · Timed'}</Text></View>
    </View></Card>)}
    <Button title="Workout history" secondary icon="progress" onPress={() => router.push('/workout/sessions')} />
  </>;
}
function Choices({ values, value, onChange, label, disabled }: { values: number[]; value: number; onChange: (value: number) => void; label: (value: number) => string; disabled: boolean }) {
  return <View style={styles.choices}>{values.map(n => <Pressable key={n} accessibilityRole="button" accessibilityLabel={label(n)} accessibilityState={{ selected: n === value, disabled }} disabled={disabled}
    onPress={() => onChange(n)} style={({ pressed }) => [styles.choice, n === value && styles.selected, (pressed || disabled) && { opacity: 0.55 }]}>
    <Text style={[s.smallStrong, n === value && { color: c.accent }]}>{label(n)}</Text>
  </Pressable>)}</View>;
}
const styles = StyleSheet.create({
  hero: { padding: 22, gap: 16, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.accentBorder },
  stats: { flexDirection: 'row', gap: 12 }, stat: { flex: 1, backgroundColor: c.bg, borderRadius: 16, padding: 14, gap: 6 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minWidth: 44, minHeight: 48, flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceRaised },
  selected: { backgroundColor: c.accentSoft, borderColor: c.accent },
});

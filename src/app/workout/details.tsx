import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useResource } from '@/features/workout/resources';
import type { Workout } from '@/features/workout/data';
import { useWorkout } from '@/features/workout/store';
import { Button, Card, Figure, Page, c, s } from '@/features/workout/ui';
import { DevelopmentIdentity } from '@/features/workout/development-identity';
import type { WorkoutOverview } from '../../../shared/discovery/overview';
import { useDiscovery } from '@/features/discovery/store';
export default function WorkoutDetailsScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { value, loading, error, retry } = useResource<{ workout: Workout | WorkoutOverview }>(typeof workoutId === 'string' && workoutId ? `/workouts/${encodeURIComponent(workoutId)}` : null);
  if (value?.workout.sessionReady === false) return <LeaderWorkoutDetails workout={value.workout} refresh={retry} />;
  return <SampleWorkoutDetails workout={value?.workout} loading={loading} error={error} retry={retry} />;
}
function LeaderWorkoutDetails({ workout, refresh }: { workout: WorkoutOverview; refresh: () => void }) {
  const { favorites, toggleFavorite } = useDiscovery();
  const saved = favorites.includes(workout.id);
  return <Page title="Workout details" onBack={() => router.canGoBack() ? router.back() : router.replace('/member2/workout')}>
    <View style={styles.hero}>
      <Text style={styles.kicker}>{workout.level.toUpperCase()} / {workout.category.toUpperCase()}</Text>
      <Text accessibilityRole="header" style={styles.heroTitle}>{workout.name}</Text>
      <Text style={styles.description}>{workout.description}</Text>
      <Text style={styles.description}>{workout.durationSeconds / 60} min · {workout.exercises.length} exercises{workout.lowImpact ? ' · Low impact' : ''}</Text>
    </View>
    <Card><Text style={s.smallStrong}>Equipment</Text><Text style={s.body}>{workout.equipment.join(', ')}</Text></Card>
    <Button title={saved ? 'Remove bookmark' : 'Bookmark workout'} secondary onPress={() => toggleFavorite(workout.id)} />
    <Text style={s.heading}>Exercise lineup</Text>
    {!workout.exercises.length && <Card><Text style={s.body}>Exercise instructions have not been added to this workout yet.</Text></Card>}
    {workout.exercises.map((exercise, index) => <Card key={exercise.id}>
      <View style={s.row}><Text style={s.number}>{index + 1}</Text><View style={{ flex: 1, gap: 4 }}>
        <Text style={s.heading}>{exercise.name}</Text><Text style={s.body}>{exercise.target}</Text>
      </View></View>
      {workout.guidanceManaged && <Button title={`Instructions: ${exercise.name}`} secondary onPress={() => router.push({ pathname: '/workout/instructions', params: { workoutId: workout.id, exercise: exercise.id } })} />}
    </Card>)}
    <Button title="Refresh exercises" secondary onPress={refresh} />
    <Card><Text style={s.heading}>Timed session coming soon</Text><Text style={s.body}>Review the exercises and available instructions now. Timed sessions will be connected in the next stage.</Text></Card>
    <Button title="Start workout — coming soon" icon="play" disabled onPress={() => {}} />
    <Button title="Explore workouts" secondary onPress={() => router.navigate('/member2/workout')} />
  </Page>;
}
function SampleWorkoutDetails({ workout, loading, error, retry }: { workout?: Workout; loading: boolean; error: string; retry: () => void }) {
  const { data, start, busy, pending } = useWorkout();
  const unfinished = data.session && ['running', 'paused'].includes(data.session.status);
  const settings = data.customSettings ? data.settings : workout;
  return <Page title="Your workout">
    {loading && <Text style={s.body}>Loading workout…</Text>}
    {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text><Button title="Retry workout" onPress={retry} /></Card>}
    {workout && settings && <>
      <View style={styles.hero}><Text style={styles.kicker}>{workout.level.toUpperCase()} / SAMPLE</Text><Text style={styles.heroTitle}>{workout.name}</Text><Text style={styles.description}>{workout.description}</Text>
        <Text style={styles.description}>{workout.exercises.length} movements · {workout.rounds} rounds · {workout.exercises.length * workout.rounds * (settings.workSeconds + settings.restSeconds) / 60} min</Text>
      </View>
      <DevelopmentIdentity />
      <Button title={unfinished ? 'Return to current workout' : 'Start workout'} icon="play" disabled={busy || pending} onPress={async () => {
        if (unfinished || await start(workout)) router.push(unfinished && data.session?.status === 'paused' ? '/workout/pause' : '/workout/active');
      }} />
      <Card><Text style={s.smallStrong}>Equipment: {workout.equipment.join(', ')}</Text><Text style={s.body}>{settings.workSeconds}s work · {settings.restSeconds}s rest</Text></Card>
      <Text style={s.heading}>The lineup</Text>
      {workout.exercises.map((exercise, i) => <Pressable key={exercise.id} accessibilityRole="button" accessibilityLabel={`Instructions for ${exercise.name}`} onPress={() => router.push({ pathname: '/workout/instructions', params: { exercise: exercise.id, workoutId: workout.id } })}>
        <Card><View style={s.row}><Figure id={exercise.id} small /><View style={{ flex: 1 }}><Text style={s.label}>MOVEMENT {i + 1}</Text><Text style={s.heading}>{exercise.name}</Text><Text style={s.body}>{exercise.subtitle}</Text></View></View></Card>
      </Pressable>)}
      <Button title="Adjust timer for next workout" secondary onPress={() => router.push('/workout/timer')} />
    </>}
    <Button title="Explore workouts" secondary onPress={() => router.navigate('/member2/workout')} />
    <Button title="Browse sample workouts" secondary onPress={() => router.replace('/workout/browse')} />
    <Button title="Session history" secondary onPress={() => router.push('/workout/sessions')} />
  </Page>;
}
const styles = StyleSheet.create({
  hero: { backgroundColor: c.accent, borderRadius: 24, padding: 22, gap: 12 },
  kicker: { color: c.ink, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  heroTitle: { color: c.ink, fontSize: 32, lineHeight: 36, fontWeight: '900' },
  description: { color: c.ink, fontSize: 14, lineHeight: 22 },
});

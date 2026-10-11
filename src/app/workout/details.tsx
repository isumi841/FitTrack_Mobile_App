import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useResource } from '@/features/workout/resources';
import type { Workout } from '@/features/workout/data';
import { useWorkout } from '@/features/workout/store';
import { Button, Card, Figure, Page, c, s } from '@/features/workout/ui';
import { MemberAccess } from '@/features/workout/member-access';
import type { WorkoutOverview } from '../../../shared/discovery/overview';
import { useDiscovery } from '@/features/discovery/store';
import { NavigationIcon } from '@/components/navigation/navigation-icon';
export default function WorkoutDetailsScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { value, loading, error, retry } = useResource<{ workout: Workout | WorkoutOverview }>(typeof workoutId === 'string' && workoutId ? `/workouts/${encodeURIComponent(workoutId)}` : null);
  if (!value) return <Page title="Workout details" showSessionFeedback={false}
    onBack={() => router.canGoBack() ? router.back() : router.replace('/member2/workout')}>
    {loading ? <Text accessibilityLiveRegion="polite" style={s.body}>Loading workout details…</Text>
      : <Card><Text style={s.heading}>Workout details unavailable</Text><Text accessibilityRole="alert" style={s.body}>{error}</Text><Button title="Try again" secondary onPress={retry} /></Card>}
  </Page>;
  if (value?.workout.sessionReady === false) return <LeaderWorkoutDetails workout={value.workout} refresh={retry} />;
  return <SampleWorkoutDetails workout={value?.workout} loading={loading} error={error} retry={retry} />;
}
function LeaderWorkoutDetails({ workout, refresh }: { workout: WorkoutOverview; refresh: () => void }) {
  const { favorites, toggleFavorite } = useDiscovery();
  const saved = favorites.includes(workout.id);
  return <Page title="Workout details" showSessionFeedback={false} onBack={() => router.canGoBack() ? router.back() : router.replace('/member2/workout')}>
    <View style={styles.hero}>
      <View style={s.row}>
        <Text style={[styles.kicker, { flex: 1 }]}>{workout.level.toUpperCase()} / {workout.category.toUpperCase()}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove bookmark' : 'Bookmark workout'}
          accessibilityState={{ selected: saved }} onPress={() => toggleFavorite(workout.id)}
          style={({ pressed }) => [styles.bookmark, saved && styles.bookmarked, pressed && styles.pressed]}>
          <NavigationIcon name="bookmark" color={saved ? c.accent : c.ink} size={22} />
        </Pressable>
      </View>
      <Text accessibilityRole="header" style={styles.heroTitle}>{workout.name}</Text>
      <Text style={styles.description}>{workout.description}</Text>
      <Text style={styles.description}>{workout.durationSeconds / 60} min · {workout.exercises.length} exercises{workout.lowImpact ? ' · Low impact' : ''}</Text>
    </View>
    <Card><Text style={s.smallStrong}>Equipment</Text><Text style={s.body}>{workout.equipment.join(', ')}</Text></Card>
    <View style={s.row}><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>Exercise lineup</Text>
      <Text style={s.body}>Explore each movement at your own pace.</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh exercises" onPress={refresh}
        style={({ pressed }) => [s.iconButton, pressed && styles.pressed]}>
        <NavigationIcon name="refresh" color={c.accent} size={21} />
      </Pressable>
    </View>
    {!workout.exercises.length && <Card><Text style={s.body}>Exercise instructions have not been added to this workout yet.</Text></Card>}
    {workout.exercises.map((exercise, index) => <Pressable key={exercise.id} disabled={!workout.guidanceManaged}
      accessibilityRole={workout.guidanceManaged ? 'button' : undefined}
      accessibilityLabel={`${exercise.name}, ${exercise.target}${exercise.subtitle ? `, ${exercise.subtitle}` : ''}`}
      accessibilityHint={workout.guidanceManaged ? 'Opens exercise instructions and video guidance' : undefined}
      onPress={() => router.push({ pathname: '/workout/instructions', params: { workoutId: workout.id, exercise: exercise.id } })}
      style={({ pressed }) => [styles.exerciseCard, pressed && styles.exercisePressed]}>
      <Text style={s.number}>{index + 1}</Text>
      <View style={styles.exerciseBody}>
        <Text style={s.heading}>{exercise.name}</Text>
        {!!exercise.subtitle && <Text style={s.body}>{exercise.subtitle}</Text>}
        <View style={styles.targetRow}><NavigationIcon name="goal" color={c.accent} size={16} /><Text style={styles.target}>{exercise.target}</Text>
          {!!exercise.video && <View style={styles.videoTag}><NavigationIcon name="play" color={c.muted} size={13} /><Text style={styles.videoLabel}>Video</Text></View>}
        </View>
      </View>
      {workout.guidanceManaged && <View style={styles.arrow}><NavigationIcon name="next" color={c.accent} size={20} /></View>}
    </Pressable>)}
    <Button title="Start workout" icon="play" disabled={!workout.guidanceManaged || !workout.exercises.length}
      onPress={() => router.push({ pathname: '/workout/start', params: { workoutId: workout.id } })} />
    <Button title="Workout history" icon="progress" secondary onPress={() => router.push('/workout/sessions')} />
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
      <MemberAccess />
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
  bookmark: { width: 44, height: 44, borderRadius: 14, backgroundColor: c.inkSoft, borderWidth: 1, borderColor: c.inkBorder, alignItems: 'center', justifyContent: 'center' },
  bookmarked: { backgroundColor: c.ink },
  pressed: { opacity: 0.65 },
  exerciseCard: { backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  exercisePressed: { backgroundColor: c.surfaceRaised, borderColor: c.accentBorder },
  exerciseBody: { flex: 1, minWidth: 0, gap: 7 },
  targetRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  target: { color: c.accent, fontSize: 13, lineHeight: 20, fontWeight: '600', flexShrink: 1 },
  videoTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 3 },
  videoLabel: { color: c.muted, fontSize: 11 },
  arrow: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
});

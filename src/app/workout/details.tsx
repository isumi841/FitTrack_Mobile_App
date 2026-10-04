import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationIcon } from '@/components/navigation/navigation-icon';
import { exercises, workout } from '@/features/workout/data';
import { useWorkout } from '@/features/workout/store';
import { Button, Card, Figure, Page, c, s } from '@/features/workout/ui';

export default function WorkoutDetailsScreen() {
  const { data, start, toggleSaved } = useWorkout();
  const unfinished = data.session && ['running', 'paused'].includes(data.session.status);
  const minutes = Math.round(15 * (data.settings.workSeconds + data.settings.restSeconds) / 60);
  return <Page title="Your workout" back={false}>
    <View style={styles.intro}>
      <Text style={s.title}>Make time for you.</Text>
      <Text style={s.body}>A little movement. A stronger every day.</Text>
    </View>
    <View style={styles.hero}>
      <View style={s.row}>
        <Text style={styles.kicker}>AT HOME / BEGINNER</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={data.saved ? 'Remove saved workout' : 'Save workout'} accessibilityState={{ selected: data.saved }} onPress={toggleSaved} style={styles.save}>
          <NavigationIcon name={data.saved ? 'check' : 'bookmark'} color={c.ink} size={20} />
        </Pressable>
      </View>
      <Text style={styles.heroTitle}>{workout.name}</Text>
      <Text style={styles.heroDescription}>Your space. Your pace. Let’s get moving.</Text>
      <View style={styles.stats}>
        {[{ value: String(minutes), label: 'MINUTES' }, { value: '5', label: 'MOVEMENTS' }, { value: '3', label: 'ROUNDS' }].map(stat => <View key={stat.label} style={styles.stat}>
          <Text style={styles.statValue}>{stat.value}</Text><Text style={styles.statLabel}>{stat.label}</Text>
        </View>)}
      </View>
    </View>
    <Button title={unfinished ? 'Return to current workout' : 'Start workout'} icon="play" onPress={() => {
      if (!unfinished) start();
      router.push(data.session?.status === 'paused' ? '/workout/pause' : '/workout/active');
    }} />
    <View style={styles.facts}>
      <View style={styles.fact}><Text style={s.label}>EQUIPMENT</Text><Text style={s.smallStrong}>Chair & wall</Text></View>
      <View style={styles.divider} />
      <View style={styles.fact}><Text style={s.label}>YOUR INTERVALS</Text><Text style={s.smallStrong}>{data.settings.workSeconds}s work · {data.settings.restSeconds}s rest</Text></View>
    </View>
    <View style={styles.intro}>
      <View style={s.row}><Text accessibilityRole="header" style={s.heading}>The lineup</Text><Text style={s.label}>5 MOVEMENTS</Text></View>
      <Text style={s.body}>Five simple movements, repeated over three rounds. Tap any movement to learn the steps.</Text>
    </View>
    <View style={styles.lineup}>
      {exercises.map((exercise, i) => <Pressable key={exercise.id} accessibilityRole="button" accessibilityLabel={`View instructions for ${exercise.name}`} onPress={() => router.push({ pathname: '/workout/instructions', params: { exercise: exercise.id } })} style={({ pressed }) => [styles.exercise, i > 0 && styles.exerciseBorder, pressed && { backgroundColor: c.surfaceRaised }]}>
        <Figure id={exercise.id} small />
        <View style={{ flex: 1, gap: 3 }}><Text style={s.label}>MOVEMENT 0{i + 1}</Text><Text style={s.smallStrong}>{exercise.name}</Text><Text style={styles.exerciseSubtitle}>{exercise.subtitle}</Text></View>
        <NavigationIcon name="next" color={c.muted} size={17} />
      </Pressable>)}
    </View>
    <Card tinted><Text style={s.smallStrong}>Ready when you are.</Text><Text style={s.body}>Set up your chair, find a little space, and move at a pace that feels comfortable.</Text></Card>
    <Button title="Adjust workout timer" icon="timer" secondary onPress={() => router.push('/workout/timer')} />
    {!!data.history.length && <Button title="View latest session summary" icon="progress" secondary onPress={() => router.push({ pathname: '/workout/completed', params: { session: data.history[0].id } })} />}
  </Page>;
}

const styles = StyleSheet.create({
  intro: { gap: 7 },
  hero: { backgroundColor: c.accent, borderRadius: 24, padding: 22, gap: 10, overflow: 'hidden' },
  kicker: { color: c.ink, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  save: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(32,39,19,0.09)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: c.ink, fontSize: 32, lineHeight: 36, letterSpacing: -0.9, fontWeight: '900', maxWidth: 260 },
  heroDescription: { color: c.ink, fontSize: 13, lineHeight: 20 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderColor: 'rgba(32,39,19,0.2)', paddingTop: 16, marginTop: 10, gap: 8 },
  stat: { flex: 1, gap: 4 },
  statValue: { color: c.ink, fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { color: c.ink, fontSize: 9, fontWeight: '600', letterSpacing: 0.7 },
  facts: { flexDirection: 'row', gap: 16, padding: 18, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  fact: { flex: 1, gap: 6 },
  divider: { width: 1, backgroundColor: c.border },
  lineup: { borderRadius: 22, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, overflow: 'hidden' },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 98 },
  exerciseBorder: { borderTopWidth: 1, borderTopColor: c.border },
  exerciseSubtitle: { color: c.muted, fontSize: 12, lineHeight: 18 },
});

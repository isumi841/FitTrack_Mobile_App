import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { Exercise } from '@/features/workout/data';
import { useExerciseSource } from '@/features/workout/resources';
import { useWorkout } from '@/features/workout/store';
import { ExerciseVideo } from '@/features/workout/exercise-video';
import { Button, Card, Page, c, s } from '@/features/workout/ui';

export default function InstructionsScreen() {
  const params = useLocalSearchParams<{ exercise?: string; workoutId?: string; sessionId?: string }>();
  const { workout, loading, error, retry } = useExerciseSource(params.workoutId, params.sessionId);
  const exercise = workout?.exercises.find(item => item.id === params.exercise);
  if (!exercise) return <Page title="How to perform" showSessionFeedback={!!params.sessionId}>
    <Text accessibilityRole={error ? 'alert' : undefined} style={s.body}>{loading ? 'Loading exercise…' : error || 'Exercise not found in this workout.'}</Text>
    {!loading && <Button title="Try again" secondary onPress={retry} />}
  </Page>;
  return <Instructions key={`${workout!.id}:${exercise.id}`} exercise={exercise} workoutId={workout!.id} sessionId={params.sessionId} />;
}

function Instructions({ exercise, workoutId, sessionId }: { exercise: Exercise; workoutId: string; sessionId?: string }) {
  const { data } = useWorkout();
  const returnToWorkout = () => {
    if (!sessionId) return router.replace({ pathname: '/workout/details', params: { workoutId } });
    if (data.session?.id === sessionId && data.session.status === 'paused') return router.replace('/workout/pause');
    if (data.session?.id === sessionId && data.session.status === 'running') return router.replace('/workout/active');
    router.replace({ pathname: '/workout/completed', params: { session: sessionId } });
  };
  return <Page title="How to perform" showSessionFeedback={!!sessionId} onBack={returnToWorkout}>
    <View style={styles.heading}>
      <Text style={s.label}>EXERCISE GUIDANCE</Text>
      <Text accessibilityRole="header" style={s.title}>{exercise.name}</Text>
      {!!exercise.subtitle && <Text style={s.body}>{exercise.subtitle}</Text>}
    </View>
    <ExerciseVideo exercise={exercise} />
    <Card>
      <Text accessibilityRole="header" style={s.heading}>Step-by-step instructions</Text>
      {exercise.steps.map((step, index) => <View key={index} style={styles.step}>
        <Text style={s.number}>{index + 1}</Text>
        <Text style={styles.instruction}>{step}</Text>
      </View>)}
      {!exercise.steps.length && <Text style={s.body}>Instructions have not been added yet.</Text>}
    </Card>
    <Button title="Return to workout" secondary onPress={returnToWorkout} />
  </Page>;
}

const styles = StyleSheet.create({
  heading: { gap: 8 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 5 },
  instruction: { flex: 1, color: c.text, fontSize: 15, lineHeight: 24, paddingTop: 2 },
});

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Text } from 'react-native';
import { useAdmin } from '@/features/exercises/admin-store';
import { useResource } from '@/features/workout/resources';
import { Button, Card, Page, s } from '@/features/workout/ui';
import type { ManagedExercise } from '../../../shared/exercise';
import type { WorkoutOverview } from '../../../shared/discovery/overview';
import AdminWorkoutPicker from '@/features/exercises/workout-picker';

export default function AdminExercises() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { token } = useAdmin();
  const path = typeof workoutId === 'string' && workoutId ? workoutId : null;
  const workout = useResource<{ workout: WorkoutOverview }>(path ? `/workouts/${encodeURIComponent(path)}` : null);
  const { value, loading, error, retry } = useResource<{ exercises: ManagedExercise[] }>(path ? `/admin/exercises?workoutId=${encodeURIComponent(path)}` : null, token);
  useFocusEffect(useCallback(() => { retry(); }, [retry]));
  if (!path) return <AdminWorkoutPicker />;
  return <Page scope="admin" title="Workout exercises" onBack={() => router.replace('/admin/exercises')}>
    <Text style={s.title}>{workout.value?.workout.name ?? 'Selected workout'}</Text>
    {!!workout.error && <Text accessibilityRole="alert" style={s.body}>{workout.error}</Text>}
    <Button title="Add exercise" disabled={!path || loading || !!error} onPress={() => router.push({ pathname: '/admin/exercise', params: { workoutId: path!, position: String((value?.exercises.reduce((max, exercise) => Math.max(max, exercise.position), 0) ?? 0) + 1) } })} />
    {loading && <Text style={s.body}>Loading exercises…</Text>}
    {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text><Button title="Retry exercises" onPress={retry} /></Card>}
    {!loading && !error && !value?.exercises.length && <Card><Text style={s.heading}>No exercises yet</Text><Text style={s.body}>Add the first exercise with its target and step-by-step instructions.</Text></Card>}
    {value?.exercises.map(exercise => <Card key={exercise.id}>
      <Text style={s.label}>EXERCISE {exercise.position}</Text><Text style={s.heading}>{exercise.name}</Text>
      <Text style={s.body}>{exercise.target} · {exercise.steps.length} instruction steps · {exercise.video ? 'Video linked' : 'No video'}</Text>
      <Button title={`Edit ${exercise.name}`} onPress={() => router.push({ pathname: '/admin/exercise', params: { workoutId: exercise.workoutId, exerciseId: exercise.id } })} />
      <Button title="Preview instructions" secondary onPress={() => router.push({ pathname: '/workout/instructions', params: { workoutId: exercise.workoutId, exercise: exercise.id } })} />
    </Card>)}
  </Page>;
}

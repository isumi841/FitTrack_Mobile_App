import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { adminStyles as a } from '@/features/exercises/admin-styles';
import { AdminCardGrid } from '@/features/exercises/admin-card-grid';
import { useAdmin } from '@/features/exercises/admin-store';
import { useResource } from '@/features/workout/resources';
import { Button, Card, Page, s } from '@/features/workout/ui';
import type { ManagedExercise } from '../../../shared/exercise';
import type { WorkoutOverview } from '../../../shared/discovery/overview';
import AdminWorkoutPicker from '@/features/exercises/workout-picker';

export default function AdminExercises() {
  const { workoutId, category } = useLocalSearchParams<{ workoutId?: string; category?: string }>();
  const { token } = useAdmin();
  const path = typeof workoutId === 'string' && workoutId ? workoutId : null;
  const workout = useResource<{ workout: WorkoutOverview }>(path ? `/workouts/${encodeURIComponent(path)}` : null);
  const { value, loading, error, retry } = useResource<{ exercises: ManagedExercise[] }>(path ? `/admin/exercises?workoutId=${encodeURIComponent(path)}` : null, token);
  useFocusEffect(useCallback(() => { retry(); }, [retry]));
  if (!path) return <AdminWorkoutPicker />;
  const parentCategory = workout.value?.workout.category ?? (typeof category === 'string' ? category : undefined);
  return <Page scope="admin" title="Workout exercises" onBack={() => router.replace({ pathname: '/admin/exercises', params: parentCategory ? { category: parentCategory } : {} })}>
    <View style={a.content}><View style={a.toolbar}><View style={a.intro}>
    <Text style={s.title}>{workout.value?.workout.name ?? 'Selected workout'}</Text>
    <Text style={s.body}>Manage the exercise lineup, instructions, and demonstration videos.</Text></View>
    {!!workout.error && <Text accessibilityRole="alert" style={s.body}>{workout.error}</Text>}
    <Button title="Add exercise" disabled={!path || loading || !!error} onPress={() => router.push({ pathname: '/admin/exercise', params: { workoutId: path!, position: String((value?.exercises.reduce((max, exercise) => Math.max(max, exercise.position), 0) ?? 0) + 1) } })} />
    </View>
    {loading && <Text style={s.body}>Loading exercises…</Text>}
    {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text><Button title="Retry exercises" onPress={retry} /></Card>}
    {!loading && !error && !value?.exercises.length && <Card><Text style={s.heading}>No exercises yet</Text><Text style={s.body}>Add the first exercise with its target and step-by-step instructions.</Text></Card>}
    <AdminCardGrid>{value?.exercises.map(exercise => <View style={[a.tile, { flexBasis: 'auto', minWidth: 0 }]} key={exercise.id}>
      <Text style={a.pill}>EXERCISE {exercise.position}</Text>
      <View style={a.tileBody}><Text style={s.heading}>{exercise.name}</Text>
      <Text style={s.smallStrong}>{exercise.target}</Text>
      {!!exercise.subtitle && <Text numberOfLines={3} style={s.body}>{exercise.subtitle}</Text>}
      <Text style={s.body}>{exercise.steps.length} instruction {exercise.steps.length === 1 ? 'step' : 'steps'} · {exercise.video ? 'Video linked' : 'No video'}</Text></View>
      <View style={a.divider} />
      <Button title="Edit" secondary onPress={() => router.push({ pathname: '/admin/exercise', params: { workoutId: exercise.workoutId, exerciseId: exercise.id } })} />
    </View>)}</AdminCardGrid></View>
  </Page>;
}

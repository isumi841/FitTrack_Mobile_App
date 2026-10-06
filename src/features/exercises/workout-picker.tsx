import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useResource } from '@/features/workout/resources';
import { Badge, Button, Card, Page, s } from '@/features/workout/ui';
import type { WorkoutOverview } from '../../../shared/discovery/overview';

export default function AdminWorkoutPicker() {
  const { value, loading, error, retry } = useResource<{ workouts: WorkoutOverview[] }>('/workouts?source=leader');
  const [query, setQuery] = useState('');
  const workouts = value?.workouts.filter(workout => `${workout.name} ${workout.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <Page scope="admin" title="Manage exercise instructions" onBack={() => router.replace('/admin')}>
    <Badge>ADMIN</Badge><Text style={s.body}>Choose a workout to manage its exercises. Workouts are created by your team’s workout manager.</Text>
    <TextInput accessibilityLabel="Search workouts to manage" placeholder="Search workouts" placeholderTextColor={s.body.color} value={query} onChangeText={setQuery} style={s.input} />
    {loading && <Text style={s.body}>Loading workouts…</Text>}
    {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text><Button title="Retry workouts" onPress={retry} /></Card>}
    {!loading && !error && !workouts?.length && <Text style={s.body}>No workouts match your search.</Text>}
    {workouts?.map(workout => <Card key={workout.id}>
      <Text style={s.heading}>{workout.name}</Text><Text style={s.body}>{workout.category} · {workout.level}</Text>
      <Button title="Manage exercises" onPress={() => router.push({ pathname: '/admin/exercises', params: { workoutId: workout.id } })} />
    </Card>)}
  </Page>;
}

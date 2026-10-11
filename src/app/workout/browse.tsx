import { router } from 'expo-router';
import { Text } from 'react-native';
import type { Workout } from '@/features/workout/data';
import { useResource } from '@/features/workout/resources';
import { MemberAccess } from '@/features/workout/member-access';
import { Badge, Button, Card, Page, s } from '@/features/workout/ui';
export default function Browse() {
  const { value, error, loading, retry } = useResource<{ workouts: Workout[] }>('/workouts');
  return <Page title="Sample workouts" back={false}>
    <Badge>TEMPORARY MEMBER 3 CATALOG</Badge><Text style={s.title}>Make time for you.</Text>
    <Text style={s.body}>Sample routines for testing exercise guidance. The team’s workout selection will replace this screen.</Text>
    <MemberAccess />
    <Button title="Session history / recover workout" secondary onPress={() => router.push('/workout/sessions')} />
    {loading && <Text style={s.body}>Loading workouts…</Text>}
    {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text><Button title="Retry catalog" onPress={retry} /></Card>}
    {!loading && !error && !value?.workouts.length && <Card><Text style={s.body}>No workouts available.</Text><Button title="Refresh catalog" onPress={retry} /></Card>}
    {value?.workouts.map(workout => <Card key={workout.id}><Badge>{workout.level}</Badge><Text style={s.heading}>{workout.name}</Text>
      <Text style={s.body}>{workout.description}</Text><Text style={s.smallStrong}>{workout.durationSeconds / 60} min · {workout.exercises.length} movements · {workout.rounds} rounds</Text>
      <Text style={s.body}>Equipment: {workout.equipment.join(', ') || 'None'}</Text>
      <Button title="View workout" onPress={() => router.push({ pathname: '/workout/details', params: { workoutId: workout.id } })} />
    </Card>)}
  </Page>;
}

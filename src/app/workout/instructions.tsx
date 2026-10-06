import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { Exercise } from '@/features/workout/data';
import { useExerciseSource } from '@/features/workout/resources';
import { useWorkout } from '@/features/workout/store';
import { Badge, Button, Card, Figure, Page, s } from '@/features/workout/ui';
export default function InstructionsScreen() {
  const params = useLocalSearchParams<{ exercise?: string; workoutId?: string; sessionId?: string }>();
  const { workout, loading, error, retry } = useExerciseSource(params.workoutId, params.sessionId);
  const exercise = workout?.exercises.find(e => e.id === params.exercise);
  if (!exercise) return <Page title="Exercise instructions"><Text style={s.body}>{loading ? 'Loading exercise…' : error || 'Exercise not found in this workout.'}</Text><Button title="Retry" onPress={retry} /></Page>;
  return <Instructions key={`${workout!.id}:${exercise.id}`} exercise={exercise} workoutId={params.workoutId} sessionId={params.sessionId} />;
}
function Instructions({ exercise, workoutId, sessionId }: { exercise: Exercise; workoutId?: string; sessionId?: string }) {
  const { data, saveNote } = useWorkout();
  const [note, setNote] = useState(data.notes[exercise.id] ?? '');
  return <Page title="How to perform"><Card><Badge>EXERCISE GUIDANCE</Badge><Text style={s.title}>{exercise.name}</Text>{['march', 'chair', 'wall-push-ups', 'side-steps', 'calf-raises'].includes(exercise.id) && <Figure id={exercise.id} />}<Text style={s.body}>{exercise.subtitle}</Text><Text style={s.smallStrong}>{exercise.cue}</Text></Card>
    {exercise.steps.map((step, i) => <View key={i} style={s.row}><Text style={s.number}>{i + 1}</Text><Text style={[s.body, { flex: 1 }]}>{step}</Text></View>)}
    <Button title="Watch video demo" onPress={() => router.push({ pathname: '/workout/video', params: { exercise: exercise.id, ...(workoutId ? { workoutId } : {}), ...(sessionId ? { sessionId } : {}) } })} />
    <Button title="Return to workout" secondary onPress={() => router.back()} />
    <Card><Text style={s.heading}>My exercise note (local only)</Text><TextInput accessibilityLabel="Local exercise note" value={note} onChangeText={setNote} maxLength={500} multiline style={s.input} /><Button title="Update local note" onPress={() => saveNote(exercise.id, note)} secondary /></Card>
  </Page>;
}

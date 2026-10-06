import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useAdmin } from '@/features/exercises/admin-store';
import { api, ApiError, requestKey } from '@/features/workout/api';
import { createExercise } from '@/features/exercises/admin-api';
import { useResource } from '@/features/workout/resources';
import { Button, Card, Page, c, s } from '@/features/workout/ui';
import type { ExerciseInput, ManagedExercise } from '../../../shared/exercise';

export default function ExerciseEditorRoute() {
  const { workoutId, exerciseId, position } = useLocalSearchParams<{ workoutId?: string; exerciseId?: string; position?: string }>();
  const { token } = useAdmin();
  const { value, loading, error, retry } = useResource<{ exercise: ManagedExercise }>(exerciseId ? `/admin/exercises/${encodeURIComponent(exerciseId)}` : null, token);
  if (!workoutId || Array.isArray(workoutId)) return <Page scope="admin" title="Exercise"><Text style={s.body}>Select a workout before adding an exercise.</Text></Page>;
  if (exerciseId && !value) return <Page scope="admin" title="Edit exercise"><Text accessibilityRole={error ? 'alert' : undefined} style={s.body}>{loading ? 'Loading exercise…' : error}</Text><Button title="Retry exercise" onPress={retry} /></Page>;
  if (value && value.exercise.workoutId !== workoutId) return <Page scope="admin" title="Exercise"><Text style={s.body}>This exercise belongs to another workout.</Text></Page>;
  return <ExerciseEditor key={`${workoutId}:${exerciseId ?? 'new'}:${value?.exercise.revision ?? 0}`} workoutId={workoutId} exercise={value?.exercise} initialPosition={Number(position) || 1} reload={retry} />;
}
function ExerciseEditor({ workoutId, exercise, initialPosition, reload }: { workoutId: string; exercise?: ManagedExercise; initialPosition: number; reload: () => void }) {
  const { token } = useAdmin();
  const [name, setName] = useState(exercise?.name ?? '');
  const [target, setTarget] = useState(exercise?.target ?? '');
  const [subtitle, setSubtitle] = useState(exercise?.subtitle ?? '');
  const [cue, setCue] = useState(exercise?.cue ?? '');
  const [steps, setSteps] = useState(exercise?.steps.join('\n') ?? '');
  const [video, setVideo] = useState(exercise?.video ?? '');
  const [position, setPosition] = useState(String(exercise?.position ?? initialPosition));
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const operation = useRef(requestKey());
  const inFlight = useRef(false);
  const [pendingCreate, setPendingCreate] = useState<ExerciseInput | null>(null);
  const returnToList = () => router.replace({ pathname: '/admin/exercises', params: { workoutId } });
  const field = (label: string, value: string, setter: (value: string) => void, max: number, multiline = false) => <View style={{ gap: 6 }}>
    <Text style={s.smallStrong}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={setter} maxLength={max} multiline={multiline} editable={!busy && !pendingCreate} style={[s.input, multiline && { minHeight: 120, textAlignVertical: 'top' }]} />
  </View>;
  async function save() {
    if (inFlight.current) return;
    setError(''); setConflict(false);
    const values: ExerciseInput = pendingCreate ?? { name: name.trim(), target: target.trim(), subtitle: subtitle.trim(), cue: cue.trim(), steps: steps.split('\n').map(step => step.trim()).filter(Boolean), video: video.trim() || null, position: Number(position) };
    if (!values.name || !values.target || values.steps.length < 1 || values.steps.length > 20 || values.steps.some(step => step.length > 500) || !Number.isInteger(values.position) || values.position < 1 || values.position > 9999) {
      setError('Enter a name, target, order from 1–9999, and 1–20 instruction steps (up to 500 characters per step).'); return;
    }
    inFlight.current = true; setBusy(true);
    try {
      if (!exercise) setPendingCreate(values);
      if (exercise) await api(`/admin/exercises/${exercise.id}`, token, 'PATCH', { ...values, revision: exercise.revision });
      else await createExercise({ ...values, workoutId, requestId: operation.current }, token, () => setRecovering(true));
      setPendingCreate(null);
      returnToList();
    } catch (failure) {
      const err = failure as ApiError;
      // Keep the exact create payload and key for retry after an uncertain network result.
      if (err.status && err.status < 500 && err.status !== 409) setPendingCreate(null);
      setError(err.message); setConflict(err.status === 409);
    } finally { inFlight.current = false; setBusy(false); setRecovering(false); }
  }
  async function remove() {
    if (!exercise || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await api(`/admin/exercises/${exercise.id}`, token, 'DELETE', { revision: exercise.revision }); returnToList(); }
    catch (failure) { const err = failure as ApiError; setError(err.message); setConflict(err.status === 409); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <Page scope="admin" title={exercise ? 'Edit exercise' : 'Add exercise'} onBack={() => { if (!busy) setConfirmLeave(true); }}>
    <Text style={s.body}>Provide the exercise target and instructions for this workout. Each line below becomes one numbered step.</Text>
    {field('Exercise name', name, setName, 100)}
    {field('Target (for example, 12 reps or 30 sec)', target, setTarget, 100)}
    {field('Order in workout', position, setPosition, 4)}
    {field('Short description (optional)', subtitle, setSubtitle, 200)}
    {field('Coaching cue (optional)', cue, setCue, 300)}
    {field('Instructions — one step per line', steps, setSteps, 10020, true)}
    <View style={{ gap: 6 }}><Text style={s.smallStrong}>Demonstration video URL (optional)</Text>
      <TextInput accessibilityLabel="Demonstration video URL" value={video} onChangeText={setVideo} editable={!busy && !pendingCreate} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={2048} placeholder="https://…/exercise.mp4" placeholderTextColor={c.muted} style={s.input} />
      <Text style={s.body}>Use a hosted HTTPS MP4 or HLS (.m3u8) link. YouTube page links and file uploads are not supported here. Clear the link to remove the video.</Text>
    </View>
    {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text>
      {conflict && exercise && <Button title="Discard edits and reload current exercise" secondary onPress={reload} />}
      {conflict && !exercise && <Text style={s.body}>Return to the exercise list to check the saved record before adding another exercise.</Text>}
    </Card>}
    {!!pendingCreate && !!error && <Text style={s.body}>The create result is uncertain. Retry uses the same details to avoid a duplicate exercise.</Text>}
    {recovering && <Text accessibilityLiveRegion="polite" style={s.body}>The response was interrupted. Checking the same save request; this will not create a duplicate exercise.</Text>}
    <Button title={busy ? recovering ? 'Checking saved exercise…' : 'Saving…' : pendingCreate ? 'Retry saving exercise' : exercise ? 'Save changes' : 'Create exercise'} disabled={busy || conflict} onPress={() => { void save(); }} />
    <Button title="Cancel" secondary disabled={busy} onPress={() => setConfirmLeave(true)} />
    {confirmLeave && <Card><Text style={s.body}>Leave this form? Unsaved edits will be discarded. If a request timed out, check the list for the saved exercise.</Text><Button title="Leave form" secondary disabled={busy} onPress={returnToList} /><Button title="Keep editing" secondary disabled={busy} onPress={() => setConfirmLeave(false)} /></Card>}
    {exercise && <Button title="Delete exercise" danger disabled={busy} onPress={() => setConfirmDelete(true)} />}
    {confirmDelete && <Card><Text style={s.heading}>Delete {exercise?.name}?</Text><Text style={s.body}>This removes the exercise and its guidance from this workout. Previously saved session records keep their recorded plan.</Text>
      <Button title="Confirm delete" danger disabled={busy} onPress={() => { void remove(); }} /><Button title="Keep exercise" secondary disabled={busy} onPress={() => setConfirmDelete(false)} />
    </Card>}
  </Page>;
}

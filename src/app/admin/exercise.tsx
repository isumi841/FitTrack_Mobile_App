import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useAdmin } from '@/features/exercises/admin-store';
import { api, ApiError, requestKey } from '@/features/workout/api';
import { createExercise } from '@/features/exercises/admin-api';
import { useResource } from '@/features/workout/resources';
import { Button, Card, Page, c, s } from '@/features/workout/ui';
import type { ExerciseInput, ManagedExercise } from '../../../shared/exercise';
import { validateExerciseForm, type ExerciseField } from '../../../shared/exercise-validation';
import { adminStyles as a } from '@/features/exercises/admin-styles';

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
  const [steps, setSteps] = useState(exercise?.steps.join('\n') ?? '');
  const [video, setVideo] = useState(exercise?.video ?? '');
  const [position, setPosition] = useState(String(exercise?.position ?? initialPosition));
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<ExerciseField, boolean>>>({});
  const inputs = useRef<Partial<Record<ExerciseField, TextInput | null>>>({});
  const validation = validateExerciseForm({ name, target, subtitle, position, steps, video });
  const operation = useRef(requestKey());
  const inFlight = useRef(false);
  const [pendingCreate, setPendingCreate] = useState<ExerciseInput | null>(null);
  const returnToList = () => router.replace({ pathname: '/admin/exercises', params: { workoutId } });
  const field = (key: ExerciseField, label: string, value: string, setter: (value: string) => void, max: number, multiline = false, hint = '') => {
    const message = (submitted || touched[key]) ? validation[key] : undefined;
    return <View style={{ gap: 8 }}>
      <Text style={s.smallStrong}>{label}</Text>
      <TextInput ref={input => { inputs.current[key] = input; }} accessibilityLabel={label}
        accessibilityHint={message || hint} value={value} onChangeText={setter}
        onBlur={() => setTouched(previous => ({ ...previous, [key]: true }))}
        maxLength={max} multiline={multiline} editable={!busy && !pendingCreate}
        autoCapitalize={key === 'video' ? 'none' : 'sentences'} autoCorrect={key !== 'video'}
        keyboardType={key === 'position' ? 'number-pad' : key === 'video' ? 'url' : 'default'}
        placeholder={key === 'target' ? 'e.g. 12 reps or 30 sec' : key === 'video' ? 'https://www.youtube.com/watch?v=…' : undefined}
        placeholderTextColor={c.muted}
        style={[s.input, multiline && { minHeight: key === 'steps' ? 240 : 100, textAlignVertical: 'top' }, message && a.invalid]} />
      {!!message && <Text accessibilityRole="alert" style={a.error}>{message}</Text>}
      {!!hint && <Text style={a.hint}>{hint}</Text>}
      {key !== 'position' && key !== 'video' && <Text style={a.hint}>{value.length}/{max} characters</Text>}
    </View>;
  };
  async function save() {
    if (inFlight.current) return;
    setError(''); setConflict(false);
    setSubmitted(true);
    const invalid = Object.keys(validation) as ExerciseField[];
    if (!pendingCreate && invalid.length) { setError('Please correct the highlighted fields before saving.'); inputs.current[invalid[0]]?.focus(); return; }
    const values: ExerciseInput = pendingCreate ?? { name: name.trim(), target: target.trim(), subtitle: subtitle.trim(), cue: exercise?.cue ?? '', steps: steps.split('\n').map(step => step.trim()).filter(Boolean), video: video.trim() || null, position: Number(position) };
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
    <View style={a.content}>
    <View style={a.intro}><Text style={s.title}>{exercise ? 'Refine your exercise' : 'Create an exercise'}</Text>
      <Text style={s.body}>Give members a clear target and easy-to-follow instructions. Fields marked * are required.</Text></View>
    <View style={a.grid}>
      <View style={a.tile}><Text style={a.pill}>01 / DETAILS</Text><Text style={s.heading}>Exercise basics</Text>
        {field('name', 'Exercise name *', name, setName, 100)}
        {field('target', 'Target *', target, setTarget, 100)}
        {field('position', 'Order in workout *', position, setPosition, 4, false, 'A whole number from 1 to 9999. Lower numbers appear first.')}
        {field('subtitle', 'Short description (optional)', subtitle, setSubtitle, 200, true)}
      </View>
      <View style={a.tile}><Text style={a.pill}>02 / INSTRUCTIONS</Text><Text style={s.heading}>Guide each movement</Text>
        {field('steps', 'Instruction steps *', steps, setSteps, 10020, true, 'Write one step per line. Add 1–20 steps, up to 500 characters each.')}
        <Text style={a.hint}>{steps.split('\n').filter(step => step.trim()).length}/20 steps</Text>
      </View>
    </View>
    <Card><Text style={a.pill}>03 / DEMONSTRATION</Text><Text style={s.heading}>Add a video</Text>
      {field('video', 'Video link (optional)', video, setVideo, 2048, false,
        'Paste an HTTPS YouTube video link (including Shorts or youtu.be), or a direct MP4/HLS link. Videos play within the exercise instructions. Choose a YouTube video that allows embedding. Clear this field to remove the video.')}
    </Card>
    {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text>
      {conflict && exercise && <Button title="Discard edits and reload current exercise" secondary onPress={reload} />}
      {conflict && !exercise && <Text style={s.body}>Return to the exercise list to check the saved record before adding another exercise.</Text>}
    </Card>}
    {!!pendingCreate && !!error && <Text style={s.body}>The create result is uncertain. Retry uses the same details to avoid a duplicate exercise.</Text>}
    {recovering && <Text accessibilityLiveRegion="polite" style={s.body}>The response was interrupted. Checking the same save request; this will not create a duplicate exercise.</Text>}
    <View style={a.actions}><Button title={busy ? recovering ? 'Checking saved exercise…' : 'Saving…' : pendingCreate ? 'Retry saving exercise' : exercise ? 'Save changes' : 'Create exercise'} disabled={busy || conflict} onPress={() => { void save(); }} />
    <Button title="Cancel" secondary disabled={busy} onPress={() => setConfirmLeave(true)} />
    </View>
    {confirmLeave && <Card><Text style={s.body}>Leave this form? Unsaved edits will be discarded. If a request timed out, check the list for the saved exercise.</Text><Button title="Leave form" secondary disabled={busy} onPress={returnToList} /><Button title="Keep editing" secondary disabled={busy} onPress={() => setConfirmLeave(false)} /></Card>}
    {exercise && <Card><Text style={s.heading}>Remove exercise</Text><Text style={s.body}>Remove this exercise from the workout lineup.</Text><View style={a.actions}><Button title="Delete exercise" danger disabled={busy} onPress={() => setConfirmDelete(true)} /></View></Card>}
    {confirmDelete && <Card><Text style={s.heading}>Delete {exercise?.name}?</Text><Text style={s.body}>This removes the exercise and its guidance from this workout. Previously saved session records keep their recorded plan.</Text>
      <Button title="Confirm delete" danger disabled={busy} onPress={() => { void remove(); }} /><Button title="Keep exercise" secondary disabled={busy} onPress={() => setConfirmDelete(false)} />
    </Card>}
    </View>
  </Page>;
}

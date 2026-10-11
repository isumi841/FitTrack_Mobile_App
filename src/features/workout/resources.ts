import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { Exercise } from './data';
import type { Session } from './engine';
import { useWorkout } from './store';

export function useResource<T>(path: string | null, token = '') {
  const [result, setResult] = useState<{ path: string; token: string; attempt: number; value: T | null; error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  useEffect(() => {
    let active = true;
    if (!path) return;
    api<T>(path, token).then(value => { if (active) setResult({ path, token, attempt, value, error: '' }); })
      .catch(err => { if (active) setResult({ path, token, attempt, value: null, error: err.message }); });
    return () => { active = false; };
  }, [path, token, attempt]);
  const matching = result?.path === path && result?.token === token && result?.attempt === attempt;
  return { value: matching ? result.value : null, error: !path ? 'A valid workout or session ID is required.' : matching ? result.error : '', loading: !!path && !matching, retry };
}
export function useExerciseSource(workoutId?: string, sessionId?: string) {
  const { token } = useWorkout();
  const resource = useResource<{ session?: Session; workout?: { id: string; name: string; exercises: Exercise[] } }>(sessionId ? `/workout-sessions/${encodeURIComponent(sessionId)}` : workoutId ? `/workouts/${encodeURIComponent(workoutId)}/exercises` : null, sessionId ? token : '');
  const workout = resource.value?.session?.snapshot ?? resource.value?.workout;
  return { ...resource, workout };
}

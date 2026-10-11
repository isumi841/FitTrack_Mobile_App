import { api, ApiError } from '../workout/api.ts';
import type { ExerciseInput, ManagedExercise } from '../../../shared/exercise';

type CreateInput = ExerciseInput & { workoutId: string; requestId: string };
export async function createExercise(input: CreateInput, token: string, onRecover: () => void) {
  // Replay only this retry-safe POST, with the exact payload and request identity.
  // A response can be lost after the database has already saved the exercise.
  const send = () => api<{ exercise: ManagedExercise }>('/admin/exercises', token, 'POST', input);
  try { return await send(); }
  catch (error) {
    if (!(error instanceof ApiError) || !(error.status >= 500 || (error.status === 0 && error.kind !== 'http'))) throw error;
    onRecover();
    return send();
  }
}

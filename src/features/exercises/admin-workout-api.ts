import { API_BASE_URL } from '@/config/api';
import { getSessionSnapshot } from '@/features/member1/auth/session';
import { validateAdminWorkout } from '../../../shared/admin-workout-validation';

export const ADMIN_WORKOUT_API = `${API_BASE_URL}/api/member2/workouts`;

// Keep the imported forms on the shared login and API address, including physical devices.
export async function adminWorkoutRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const session = getSessionSnapshot();
  if (session?.user.role !== 'admin') throw new Error('Sign in as an administrator to manage workouts.');
  if (['POST', 'PUT'].includes(options.method ?? 'GET')) {
    const input = validateAdminWorkout(JSON.parse(String(options.body)), options.method === 'PUT');
    options = { ...options, body: JSON.stringify(input) };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal,
      headers: { ...options.headers, 'Content-Type': 'application/json', Authorization: `Bearer ${session.session.accessToken}` } });
    const payload = await response.json();
    if (getSessionSnapshot()?.session.accessToken !== session.session.accessToken) throw new Error('Your sign-in changed. Reopen Workout Management.');
    if (!response.ok) throw new Error(payload.error || payload.message || `Workout request failed (${response.status}).`);
    // The branch forms expect a Response; retain its interface after consuming the body within the timeout.
    return new Response(JSON.stringify(payload), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (controller.signal.aborted || error instanceof TypeError) throw new Error('Unable to confirm the workout request. Check your connection and refresh the workout list before retrying.');
    throw error;
  } finally { clearTimeout(timeout); }
}

import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { getSessionSnapshot } from '@/features/member1/auth/session';

interface ApiSingleResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ApiListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

export type ApiGoalType =
  | 'workoutsPerWeek'
  | 'caloriesPerWeek'
  | 'workoutMinutes'
  | 'monthlyWorkouts';

export interface ApiGoal {
  _id: string;
  userId: string;

  goalType: ApiGoalType;

  title: string;

  target: number;
  current: number;

  duration:
    | 'Weekly'
    | 'Monthly';

  status:
    | 'active'
    | 'completed'
    | 'archived';

  startDate: string;
  endDate: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPayload {
  goalType: ApiGoalType;

  title: string;

  target: number;

  current?: number;

  duration:
    | 'Weekly'
    | 'Monthly';
}

export interface UpdateGoalPayload {
  goalType?: ApiGoalType;

  title?: string;

  target?: number;

  current?: number;

  duration?:
    | 'Weekly'
    | 'Monthly';

  status?:
    | 'active'
    | 'completed'
    | 'archived';
}

export interface ApiUserProfile {
  _id: string;
  userId: string;

  fullName: string;
  username: string;

  email?: string;
  phone?: string;

  dateOfBirth?: string;

  gender?:
    | 'Male'
    | 'Female'
    | 'Prefer not to say';

  bio?: string;

  focus?: string[];

  avatarUrl?: string;

  createdAt: string;
  updatedAt: string;
}

export type AvatarUploadFile = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export interface ProfilePayload {
  fullName: string;
  username: string;

  email?: string;
  phone?: string;

  dateOfBirth?: string;

  gender?:
    | 'Male'
    | 'Female'
    | 'Prefer not to say';

  bio?: string;

  focus?: string[];

  avatarUrl?: string;
}

export type ApiReminderDay =
  | 'Mon'
  | 'Tue'
  | 'Wed'
  | 'Thu'
  | 'Fri'
  | 'Sat'
  | 'Sun';

export interface ApiReminder {
  _id: string;
  userId: string;

  enabled: boolean;
  time: string;
  days: ApiReminderDay[];

  soundEnabled: boolean;
  vibrationEnabled: boolean;
  motivationalMessage: boolean;

  timezone: string;
  label: string;

  createdAt: string;
  updatedAt: string;
}

export interface ReminderPayload {
  enabled: boolean;
  time: string;
  days: ApiReminderDay[];

  soundEnabled: boolean;
  vibrationEnabled: boolean;
  motivationalMessage: boolean;

  timezone: string;
  label: string;
}

export type UpdateReminderPayload =
  Partial<ReminderPayload>;

async function request<T>(path: string, options: RequestInit = {}, multipart = false): Promise<T> {
  const account = getSessionSnapshot();
  if (!account || account.user.role === 'admin') throw new Error('Please log in with a member account.');
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) throw new Error('The API address is not configured.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), multipart ? 60000 : 15000);
  try {
    const fetcher = multipart && Platform.OS !== 'web' ? expoFetch : fetch;
    const response = await fetcher(base + '/api/member4' + path, { ...options, signal: controller.signal,
      headers: { ...(!multipart ? { 'Content-Type': 'application/json' } : {}), Authorization: 'Bearer ' + account.session.accessToken } });
    const result = await response.json();
    if (getSessionSnapshot() !== account) throw new Error('Your account changed. Please reopen this screen.');
    if (!response.ok) { const error = new Error(result.message || result.error || 'Unable to complete this request.'); Object.assign(error, { status: response.status }); throw error; }
    return result as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The request timed out. Refresh before retrying.');
    throw error;
  } finally { clearTimeout(timer); }
}
const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) });
export const getGoals = () => request<ApiListResponse<ApiGoal>>('/goals');
export const createGoal = (data: CreateGoalPayload) => request<ApiSingleResponse<ApiGoal>>('/goals', json('POST', data));
export const updateGoal = (id: string, data: UpdateGoalPayload) => request<ApiSingleResponse<ApiGoal>>('/goals/' + encodeURIComponent(id), json('PATCH', data));
export const deleteGoal = (id: string) => request('/goals/' + encodeURIComponent(id), { method: 'DELETE' });
export async function getProfile() {
  try { return await request<ApiSingleResponse<ApiUserProfile>>('/profile'); }
  catch (error) { if ((error as { status?: number }).status === 404) return null; throw error; }
}
export const createProfile = (data: ProfilePayload) => request<ApiSingleResponse<ApiUserProfile>>('/profile', json('POST', data));
export const updateProfile = (data: Partial<ProfilePayload>) => request<ApiSingleResponse<ApiUserProfile>>('/profile', json('PATCH', data));
export const deleteProfile = () => request('/profile', { method: 'DELETE' });
export const getReminders = () => request<ApiListResponse<ApiReminder>>('/reminders');
export const createReminder = (data: ReminderPayload) => request<ApiSingleResponse<ApiReminder>>('/reminders', json('POST', data));
export const updateReminder = (id: string, data: UpdateReminderPayload) => request<ApiSingleResponse<ApiReminder>>('/reminders/' + encodeURIComponent(id), json('PATCH', data));
export const deleteReminder = (id: string) => request('/reminders/' + encodeURIComponent(id), { method: 'DELETE' });
export async function uploadProfileAvatar(file: AvatarUploadFile) {
  const blob = Platform.OS === 'web' ? await (await fetch(file.uri)).blob() : new File(file.uri);
  const form = new FormData();
  form.append('avatar', blob, file.fileName || 'profile.jpg');
  return request<ApiSingleResponse<ApiUserProfile>>('/profile/avatar', { method: 'POST', body: form }, true);
}
export const deleteProfileAvatar = () => request<ApiSingleResponse<ApiUserProfile>>('/profile/avatar', { method: 'DELETE' });

import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

const API_BASE_URL =
  'http://localhost:5001/api/member4';

const DEV_USER_ID =
  '507f1f77bcf86cd799439011';

/* =====================================================
   COMMON API TYPES
===================================================== */

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

/* =====================================================
   GOAL API TYPES
===================================================== */

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

/* =====================================================
   REQUEST HELPER
===================================================== */

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,

      headers: {
        'Content-Type':
          'application/json',

        'x-user-id':
          DEV_USER_ID,

        ...(options.headers as Record<
          string,
          string
        >),
      },
    },
  );

  let result: any;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid response.',
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Something went wrong.',
    );
  }

  return result as T;
}

/* =====================================================
   GOALS
===================================================== */

export async function getGoals() {
  return request<
    ApiListResponse<ApiGoal>
  >('/goals');
}

export async function createGoal(
  data: CreateGoalPayload,
) {
  return request<
    ApiSingleResponse<ApiGoal>
  >('/goals', {
    method: 'POST',

    body: JSON.stringify(data),
  });
}

export async function updateGoal(
  id: string,
  data: UpdateGoalPayload,
) {
  return request<
    ApiSingleResponse<ApiGoal>
  >(`/goals/${id}`, {
    method: 'PATCH',

    body: JSON.stringify(data),
  });
}

export async function deleteGoal(
  id: string,
) {
  return request<{
    success: boolean;

    message: string;

    data: {
      id: string;
    };
  }>(`/goals/${id}`, {
    method: 'DELETE',
  });
}

/* =====================================================
   PROFILE API TYPES
===================================================== */

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

export async function uploadProfileAvatar(
  file: AvatarUploadFile,
) {
  const imageFile =
    new File(file.uri);

  const formData =
    new FormData();

  formData.append(
    'avatar',
    imageFile,
  );

  const response =
    await expoFetch(
      `${API_BASE_URL}/profile/avatar`,
      {
        method: 'POST',

        headers: {
          Accept:
            'application/json',

          'x-user-id':
            DEV_USER_ID,
        },

        body: formData,
      },
    );

  let result:
    ApiSingleResponse<ApiUserProfile>;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid image upload response.',
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Unable to upload profile photo.',
    );
  }

  return result;
}

export async function deleteProfileAvatar() {
  const response =
    await fetch(
      `${API_BASE_URL}/profile/avatar`,
      {
        method: 'DELETE',

        headers: {
          'x-user-id':
            DEV_USER_ID,
        },
      },
    );

  let result:
    ApiSingleResponse<ApiUserProfile>;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid response.',
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Unable to remove profile photo.',
    );
  }

  return result;
}

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

/* =====================================================
   PROFILE
===================================================== */

export async function getProfile() {
  const response = await fetch(
    `${API_BASE_URL}/profile`,
    {
      headers: {
        'Content-Type':
          'application/json',

        'x-user-id':
          DEV_USER_ID,
      },
    },
  );

  let result: any;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid response.',
    );
  }

  /*
   * A 404 means this user has
   * not created a profile yet.
   */
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Unable to load profile.',
    );
  }

  return result as {
    success: boolean;
    data: ApiUserProfile;
  };
}

export async function createProfile(
  data: ProfilePayload,
) {
  return request<{
    success: boolean;
    message?: string;
    data: ApiUserProfile;
  }>('/profile', {
    method: 'POST',

    body: JSON.stringify(data),
  });
}

export async function updateProfile(
  data: Partial<ProfilePayload>,
) {
  return request<{
    success: boolean;
    message?: string;
    data: ApiUserProfile;
  }>('/profile', {
    method: 'PATCH',

    body: JSON.stringify(data),
  });
}

export async function deleteProfile() {
  return request<{
    success: boolean;
    message?: string;
    data?: unknown;
  }>('/profile', {
    method: 'DELETE',
  });
}

/* =====================================================
   REMINDERS
===================================================== */

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

export async function getReminders() {
  return request<
    ApiListResponse<ApiReminder>
  >('/reminders');
}

export async function createReminder(
  data: ReminderPayload,
) {
  return request<
    ApiSingleResponse<ApiReminder>
  >('/reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReminder(
  id: string,
  data: UpdateReminderPayload,
) {
  return request<
    ApiSingleResponse<ApiReminder>
  >(`/reminders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteReminder(
  id: string,
) {
  return request<{
    success: boolean;
    message: string;
    data: {
      id: string;
    };
  }>(`/reminders/${id}`, {
    method: 'DELETE',
  });
}

/* =====================================================
   WORKOUTS
===================================================== */

export async function getWorkouts() {
  return request<{
    success: boolean;

    count: number;

    data: any[];
  }>('/workouts');
}

export async function createWorkout(
  data: any,
) {
  return request(
    '/workouts',
    {
      method: 'POST',

      body: JSON.stringify(data),
    },
  );
}

export async function updateWorkout(
  id: string,
  data: any,
) {
  return request(
    `/workouts/${id}`,
    {
      method: 'PATCH',

      body: JSON.stringify(data),
    },
  );
}

export async function deleteWorkout(
  id: string,
) {
  return request(
    `/workouts/${id}`,
    {
      method: 'DELETE',
    },
  );
}
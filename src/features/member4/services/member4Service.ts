/**
 * Member 4 – Placeholder service layer.
 * All functions are stubs for future Node/Express → MongoDB integration.
 * No real HTTP calls are made here.
 */

import type {
  Achievement,
  Goal,
  GoalDuration,
  GoalType,
  ProgressPeriodData,
  ProgressStats,
  UserProfile,
  WorkoutHistoryItem,
  WorkoutReminder,
} from '../types';

// ─────────────────────────────────────────────
//  Progress
// ─────────────────────────────────────────────

/**
 * Fetch weekly progress stats for a user.
 * Future: GET /api/progress/:userId/stats?period=week
 */
export async function fetchProgressStats(_userId: string): Promise<ProgressStats> {
  throw new Error('fetchProgressStats: not yet implemented – awaiting API');
}

/**
 * Fetch bar-chart data for a given period.
 * Future: GET /api/progress/:userId/period?type=Week|Month|Year
 */
export async function fetchProgressPeriod(
  _userId: string,
  _period: 'Week' | 'Month' | 'Year',
): Promise<ProgressPeriodData> {
  throw new Error('fetchProgressPeriod: not yet implemented – awaiting API');
}

// ─────────────────────────────────────────────
//  Workout History
// ─────────────────────────────────────────────

/**
 * Fetch paginated workout history.
 * Future: GET /api/workouts/:userId/history?page=1&limit=20
 */
export async function fetchWorkoutHistory(_userId: string): Promise<WorkoutHistoryItem[]> {
  throw new Error('fetchWorkoutHistory: not yet implemented – awaiting API');
}

// ─────────────────────────────────────────────
//  Goals
// ─────────────────────────────────────────────

/**
 * Fetch all goals for a user.
 * Future: GET /api/goals/:userId
 */
export async function fetchGoals(_userId: string): Promise<Goal[]> {
  throw new Error('fetchGoals: not yet implemented – awaiting API');
}

/**
 * Create a new goal.
 * Future: POST /api/goals/:userId
 */
export async function createGoal(
  _userId: string,
  _payload: { type: GoalType; targetValue: number; duration: GoalDuration },
): Promise<Goal> {
  throw new Error('createGoal: not yet implemented – awaiting API');
}

/**
 * Update an existing goal.
 * Future: PATCH /api/goals/:userId/:goalId
 */
export async function updateGoal(
  _userId: string,
  _goalId: string,
  _payload: Partial<Goal>,
): Promise<Goal> {
  throw new Error('updateGoal: not yet implemented – awaiting API');
}

/**
 * Delete a goal.
 * Future: DELETE /api/goals/:userId/:goalId
 */
export async function deleteGoal(_userId: string, _goalId: string): Promise<void> {
  throw new Error('deleteGoal: not yet implemented – awaiting API');
}

// ─────────────────────────────────────────────
//  Achievements
// ─────────────────────────────────────────────

/**
 * Fetch all achievements for a user.
 * Future: GET /api/achievements/:userId
 */
export async function fetchAchievements(_userId: string): Promise<Achievement[]> {
  throw new Error('fetchAchievements: not yet implemented – awaiting API');
}

// ─────────────────────────────────────────────
//  Reminders
// ─────────────────────────────────────────────

/**
 * Fetch all reminders for a user.
 * Future: GET /api/reminders/:userId
 */
export async function fetchReminders(_userId: string): Promise<WorkoutReminder[]> {
  throw new Error('fetchReminders: not yet implemented – awaiting API');
}

/**
 * Save (create/update) a reminder.
 * Future: POST /api/reminders/:userId
 */
export async function saveReminder(
  _userId: string,
  _reminder: Omit<WorkoutReminder, 'id'> & { id?: string },
): Promise<WorkoutReminder> {
  throw new Error('saveReminder: not yet implemented – awaiting API');
}

// ─────────────────────────────────────────────
//  User Profile
// ─────────────────────────────────────────────

/**
 * Fetch the user's profile.
 * Future: GET /api/users/:userId/profile
 */
export async function fetchUserProfile(_userId: string): Promise<UserProfile> {
  throw new Error('fetchUserProfile: not yet implemented – awaiting API');
}

/**
 * Update the user's profile fields.
 * Future: PATCH /api/users/:userId/profile
 */
export async function updateUserProfile(
  _userId: string,
  _payload: Partial<UserProfile>,
): Promise<UserProfile> {
  throw new Error('updateUserProfile: not yet implemented – awaiting API');
}

/**
 * Upload a new profile photo.
 * Future: POST /api/users/:userId/avatar  (multipart/form-data)
 */
export async function uploadProfilePhoto(_userId: string, _photoUri: string): Promise<string> {
  throw new Error('uploadProfilePhoto: not yet implemented – awaiting API');
}

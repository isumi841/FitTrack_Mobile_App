/**
 * Member 4 – Progress & Motivation TypeScript interfaces.
 */

// ─────────────────────────────────────────────
//  Progress
// ─────────────────────────────────────────────

export interface ProgressStats {
  workoutsCompleted: number;
  workoutsTarget: number;
  totalMinutes: number;
  targetMinutes: number;
  caloriesBurned: number;
  streakDays: number;
  weeklyCompletionPct: number;
}

export interface DailyActivityBar {
  day: string;     // 'Mon' | 'Tue' | ...
  minutes: number;
  workout?: string;
  isSelected?: boolean;
}

export interface ProgressPeriodData {
  period: 'Week' | 'Month' | 'Year';
  bars: DailyActivityBar[];
  avgSession: number;
  bestDay: string;
  consistencyPct: number;
}

// ─────────────────────────────────────────────
//  Workout History
// ─────────────────────────────────────────────

export type WorkoutStatus = 'Completed' | 'Incomplete';

export interface WorkoutHistoryItem {
  id: string;
  name: string;
  duration: number;        // minutes
  calories: number;        // kcal
  timeLabel: string;       // e.g. '8:30 AM'
  status: WorkoutStatus;
  section: 'Today' | 'Yesterday' | 'Last Week';
  tags: string[];          // e.g. ['15 min', 'This Month']
}

// ─────────────────────────────────────────────
//  Goals
// ─────────────────────────────────────────────

export type GoalType =
  | 'Workouts per week'
  | 'Calories per week'
  | 'Workout minutes'
  | 'Monthly workouts';

export type GoalDuration = 'Weekly' | 'Monthly';

export interface Goal {
  id: string;
  type: GoalType;
  label: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  duration: GoalDuration;
  progressPct: number;
  remainingLabel: string;
}

// ─────────────────────────────────────────────
//  Achievements
// ─────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;            // emoji or SF Symbol name
  earnedOn?: string;       // ISO date string or readable label
  isUnlocked: boolean;
}

// ─────────────────────────────────────────────
//  Workout Reminder
// ─────────────────────────────────────────────

export type WeekDay = 'M' | 'T' | 'W' | 'Th' | 'F' | 'S' | 'Su';

export interface WorkoutReminder {
  id: string;
  label: string;
  timeHour: number;        // 0-23
  timeMinute: number;      // 0-59
  activeDays: WeekDay[];
  message: string;
  isEnabled: boolean;
}

// ─────────────────────────────────────────────
//  User Profile
// ─────────────────────────────────────────────

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  dateOfBirth: string;
  gender: string;
  fitnessFocusTags: string[];
  bio: string;
  avatarInitials: string;
}

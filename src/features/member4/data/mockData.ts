/**
 * Member 4 – Mock data for Progress & Motivation feature.
 * All data is static/local; no backend calls are made here.
 */

import type {
  Achievement,
  DailyActivityBar,
  Goal,
  ProgressPeriodData,
  ProgressStats,
  UserProfile,
  WeekDay,
  WorkoutHistoryItem,
  WorkoutReminder,
} from '../types';

// ─────────────────────────────────────────────
//  Progress Dashboard
// ─────────────────────────────────────────────

export const mockProgressStats: ProgressStats = {
  workoutsCompleted: 4,
  workoutsTarget: 5,
  totalMinutes: 128,
  targetMinutes: 150,
  caloriesBurned: 940,
  streakDays: 6,
  weeklyCompletionPct: 80,
};

export const mockWeeklyBars: DailyActivityBar[] = [
  { day: 'M',  minutes: 30, workout: 'Full Body Burn' },
  { day: 'T',  minutes: 25, workout: '15-Min Core' },
  { day: 'W',  minutes: 20, workout: 'Stretching' },
  { day: 'T',  minutes: 35, workout: 'Full Body HIIT', isSelected: true },
  { day: 'F',  minutes: 18, workout: 'Wall Push-Ups' },
  { day: 'S',  minutes: 0 },
  { day: 'S',  minutes: 0 },
];

export const mockRecentWorkouts: WorkoutHistoryItem[] = [
  {
    id: 'rw1',
    name: '15-Min Core Burn',
    duration: 15,
    calories: 220,
    timeLabel: '8:30 AM',
    status: 'Completed',
    section: 'Today',
    tags: ['15 min', 'This Month'],
  },
  {
    id: 'rw2',
    name: 'Wall Push-Ups Circuit',
    duration: 10,
    calories: 140,
    timeLabel: '7:15 AM',
    status: 'Completed',
    section: 'Yesterday',
    tags: ['This Month'],
  },
];

// ─────────────────────────────────────────────
//  Progress Details
// ─────────────────────────────────────────────

export const mockWeekData: ProgressPeriodData = {
  period: 'Week',
  bars: [
    { day: 'Mon', minutes: 18, workout: 'Morning Stretch' },
    { day: 'Tue', minutes: 24, workout: '15-Min Core Burn' },
    { day: 'Wed', minutes: 20, workout: 'Wall Push-Ups' },
    { day: 'Thu', minutes: 32, workout: 'Full Body HIIT', isSelected: true },
    { day: 'Fri', minutes: 26, workout: 'Cardio Blast' },
    { day: 'Sat', minutes: 15, workout: 'Easy Walk' },
    { day: 'Sun', minutes: 10, workout: 'Rest Stretch' },
  ],
  avgSession: 21,
  bestDay: 'Thursday',
  consistencyPct: 71,
};

export const mockMonthData: ProgressPeriodData = {
  period: 'Month',
  bars: [
    { day: 'W1', minutes: 95 },
    { day: 'W2', minutes: 112 },
    { day: 'W3', minutes: 145, isSelected: true },
    { day: 'W4', minutes: 128 },
  ],
  avgSession: 120,
  bestDay: 'Week 3',
  consistencyPct: 68,
};

export const mockYearData: ProgressPeriodData = {
  period: 'Year',
  bars: [
    { day: 'Jan', minutes: 320 },
    { day: 'Feb', minutes: 280 },
    { day: 'Mar', minutes: 410 },
    { day: 'Apr', minutes: 390 },
    { day: 'May', minutes: 450 },
    { day: 'Jun', minutes: 510, isSelected: true },
    { day: 'Jul', minutes: 480 },
    { day: 'Aug', minutes: 530 },
    { day: 'Sep', minutes: 490 },
    { day: 'Oct', minutes: 380 },
    { day: 'Nov', minutes: 300 },
    { day: 'Dec', minutes: 260 },
  ],
  avgSession: 400,
  bestDay: 'August',
  consistencyPct: 83,
};

// ─────────────────────────────────────────────
//  Workout History
// ─────────────────────────────────────────────

export const mockWorkoutHistory: WorkoutHistoryItem[] = [
  {
    id: 'wh1',
    name: '15-Min Core Burn',
    duration: 15,
    calories: 220,
    timeLabel: '8:30 AM',
    status: 'Completed',
    section: 'Today',
    tags: ['15 min', 'This Month'],
  },
  {
    id: 'wh2',
    name: 'Wall Push-Ups Circuit',
    duration: 10,
    calories: 140,
    timeLabel: '7:15 AM',
    status: 'Completed',
    section: 'Yesterday',
    tags: ['This Month'],
  },
  {
    id: 'wh3',
    name: 'Beginner Full Body',
    duration: 15,
    calories: 210,
    timeLabel: '6:50 PM',
    status: 'Completed',
    section: 'Yesterday',
    tags: ['15 min', 'This Month'],
  },
  {
    id: 'wh4',
    name: '5-Min Quick Stretch',
    duration: 5,
    calories: 60,
    timeLabel: '7:00 AM',
    status: 'Incomplete',
    section: 'Yesterday',
    tags: ['5 min', 'This Month'],
  },
  {
    id: 'wh5',
    name: '30-Min Fat Burn HIIT',
    duration: 30,
    calories: 310,
    timeLabel: 'Mon, 6:15 PM',
    status: 'Completed',
    section: 'Last Week',
    tags: ['30 min', 'This Month'],
  },
  {
    id: 'wh6',
    name: 'Standing Side Steps',
    duration: 12,
    calories: 95,
    timeLabel: 'Wed, 7:40 AM',
    status: 'Completed',
    section: 'Last Week',
    tags: ['This Month'],
  },
];

// ─────────────────────────────────────────────
//  Goals
// ─────────────────────────────────────────────

export const mockGoals: Goal[] = [
  {
    id: 'g1',
    type: 'Workouts per week',
    label: 'Work out 5 days a week',
    targetValue: 5,
    currentValue: 4,
    unit: 'workouts',
    duration: 'Weekly',
    progressPct: 80,
    remainingLabel: '1 more workout to go',
  },
  {
    id: 'g2',
    type: 'Calories per week',
    label: 'Burn 1200 calories weekly',
    targetValue: 1200,
    currentValue: 940,
    unit: 'kcal',
    duration: 'Weekly',
    progressPct: 78,
    remainingLabel: '260 kcal remaining',
  },
  {
    id: 'g3',
    type: 'Monthly workouts',
    label: 'Complete 20 workouts this month',
    targetValue: 20,
    currentValue: 12,
    unit: 'workouts',
    duration: 'Monthly',
    progressPct: 60,
    remainingLabel: '8 workouts to go',
  },
];

// ─────────────────────────────────────────────
//  Achievements
// ─────────────────────────────────────────────

export const mockAchievements: Achievement[] = [
  {
    id: 'a1',
    title: 'First Workout',
    description: 'Completed your very first workout. Every journey begins with a single step!',
    icon: '🏆',
    earnedOn: 'Sep 10, 2026',
    isUnlocked: true,
  },
  {
    id: 'a2',
    title: '7-Day Streak',
    description: 'Completed workouts 7 days in a row without missing a single day. Consistency is the foundation of progress.',
    icon: '🔥',
    earnedOn: 'Sep 17, 2026',
    isUnlocked: true,
  },
  {
    id: 'a3',
    title: 'Early Bird',
    description: 'Completed 5 workouts before 7 AM. Rise and shine!',
    icon: '🌅',
    earnedOn: 'Sep 20, 2026',
    isUnlocked: true,
  },
  {
    id: 'a4',
    title: '10 Workouts',
    description: 'Completed 10 total workouts. Building a habit!',
    icon: '💪',
    earnedOn: 'Sep 25, 2026',
    isUnlocked: true,
  },
  {
    id: 'a5',
    title: 'Calorie Crusher',
    description: 'Burned 5000 total calories. Keep the fire burning!',
    icon: '⚡',
    earnedOn: 'Sep 28, 2026',
    isUnlocked: true,
  },
  {
    id: 'a6',
    title: 'Weekend Warrior',
    description: 'Completed workouts on 4 consecutive weekends.',
    icon: '🛡️',
    earnedOn: 'Oct 1, 2026',
    isUnlocked: true,
  },
  {
    id: 'a7',
    title: '14-Day Streak',
    description: 'Completed workouts 14 days in a row without missing a single day.',
    icon: '🔥',
    isUnlocked: false,
  },
  {
    id: 'a8',
    title: '30-Day Streak',
    description: 'An entire month of consecutive daily workouts. Legendary dedication!',
    icon: '👑',
    isUnlocked: false,
  },
  {
    id: 'a9',
    title: '50 Workouts',
    description: 'Completed 50 total workouts. You are unstoppable!',
    icon: '🎯',
    isUnlocked: false,
  },
  {
    id: 'a10',
    title: 'Marathon Mind',
    description: 'Accumulated 1000 total workout minutes. A true endurance athlete!',
    icon: '🏅',
    isUnlocked: false,
  },
];

// ─────────────────────────────────────────────
//  Reminders
// ─────────────────────────────────────────────

export const mockReminders: WorkoutReminder[] = [
  {
    id: 'r1',
    label: 'Morning Workout',
    timeHour: 7,
    timeMinute: 0,
    activeDays: ['M', 'W', 'F'] as WeekDay[],
    message: 'Time for your 15-minute workout!',
    isEnabled: true,
  },
  {
    id: 'r2',
    label: 'Evening Stretch',
    timeHour: 20,
    timeMinute: 30,
    activeDays: ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'] as WeekDay[],
    message: "Don't forget your evening stretch!",
    isEnabled: false,
  },
];

// ─────────────────────────────────────────────
//  User Profile
// ─────────────────────────────────────────────

export const mockUserProfile: UserProfile = {
  id: 'u1',
  fullName: 'Nimal Perera',
  username: '@nimal_fitness',
  email: 'nimal.perera@example.com',
  emailVerified: true,
  phone: '+1 (555) 234-5678',
  dateOfBirth: 'Oct 14, 1992',
  gender: 'Male',
  fitnessFocusTags: ['Stronger Every Day', 'Endurance'],
  bio: 'Passionate about morning calisthenics, functional strength, and staying consistent 5x a week. #StayHard',
  avatarInitials: 'NP',
};

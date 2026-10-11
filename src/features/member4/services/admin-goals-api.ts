import { API_BASE_URL } from '@/config/api';

export type GoalCategory = 'Consistency' | 'Strength' | 'Endurance' | 'Mobility';
export type GoalStatus = 'On track' | 'At risk' | 'Completed';
export type GoalDuration = 'Weekly' | 'Monthly';

export interface AdminGoalItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  title: string;
  description?: string;
  category: GoalCategory;
  current: number;
  target: number;
  unit: string;
  duration: GoalDuration;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_COLORS: Record<GoalCategory, { text: string; bg: string; border: string }> = {
  Consistency: { text: '#C6FF3D', bg: 'rgba(198, 255, 61, 0.12)', border: 'rgba(198, 255, 61, 0.3)' },
  Strength: { text: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  Endurance: { text: '#F472B6', bg: 'rgba(244, 114, 182, 0.12)', border: 'rgba(244, 114, 182, 0.3)' },
  Mobility: { text: '#A78BFA', bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.3)' },
};

export const STATUS_COLORS: Record<GoalStatus, { text: string; bg: string; dot: string }> = {
  'On track': { text: '#C6FF3D', bg: 'rgba(198, 255, 61, 0.12)', dot: '#C6FF3D' },
  'At risk': { text: '#FB923C', bg: 'rgba(251, 146, 60, 0.15)', dot: '#FB923C' },
  Completed: { text: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)', dot: '#4ADE80' },
};

export const INITIAL_DEMO_GOALS: AdminGoalItem[] = [
  {
    id: 'demo-goal-1',
    userId: 'user-sarah',
    userName: 'Sarah Jenkins',
    userEmail: 'sarah.j@example.com',
    userRole: 'user',
    title: '5x Weekly Cardio Sessions',
    description: 'Maintain high cardio aerobic base with 30 min morning runs or cycling.',
    category: 'Endurance',
    current: 4,
    target: 5,
    unit: 'sessions',
    duration: 'Weekly',
    status: 'On track',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'demo-goal-2',
    userId: 'user-alex',
    userName: 'Alex Rivera',
    userEmail: 'alex.rivera@example.com',
    userRole: 'user',
    title: 'Heavy Deadlift & Squat Routine',
    description: 'Hit progressive overload targets across 4 compound lifting days.',
    category: 'Strength',
    current: 4,
    target: 4,
    unit: 'workouts',
    duration: 'Weekly',
    status: 'Completed',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'demo-goal-3',
    userId: 'user-david',
    userName: 'David Chen',
    userEmail: 'david.chen@example.com',
    userRole: 'user',
    title: '12,000 Daily Step Consistency',
    description: 'Walk or jog to achieve steady step count target every day of the week.',
    category: 'Consistency',
    current: 4,
    target: 7,
    unit: 'days',
    duration: 'Weekly',
    status: 'At risk',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
  {
    id: 'demo-goal-4',
    userId: 'user-emma',
    userName: 'Emma Watson',
    userEmail: 'emma.fit@example.com',
    userRole: 'user',
    title: 'Daily Post-Workout Mobility & Yoga',
    description: '20 minutes of dynamic stretching and hip mobility drills.',
    category: 'Mobility',
    current: 6,
    target: 7,
    unit: 'sessions',
    duration: 'Weekly',
    status: 'On track',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'demo-goal-5',
    userId: 'user-marcus',
    userName: 'Marcus Brody',
    userEmail: 'm.brody@example.com',
    userRole: 'user',
    title: '1,500 Active Workout Minutes',
    description: 'Accumulate structured monthly training volume across HIIT and strength.',
    category: 'Endurance',
    current: 1520,
    target: 1500,
    unit: 'minutes',
    duration: 'Monthly',
    status: 'Completed',
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'demo-goal-6',
    userId: 'user-lisa',
    userName: 'Lisa Ray',
    userEmail: 'lisa.ray@example.com',
    userRole: 'user',
    title: 'Core Strength & Planks Progression',
    description: 'Complete 3 weekly dedicated abdominal and posterior core routines.',
    category: 'Strength',
    current: 1,
    target: 3,
    unit: 'sessions',
    duration: 'Weekly',
    status: 'At risk',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

export async function fetchAdminDbGoals(accessToken: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/goals`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.goals || [];
  } catch {
    return [];
  }
}

export async function createAdminDbGoal(
  accessToken: string,
  payload: { userId?: string; title: string; target: number; current?: number; duration?: string; category?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/admin/goals`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteAdminDbGoal(accessToken: string, id: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/admin/goals/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
}

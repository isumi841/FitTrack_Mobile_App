import { isFinished, type Session } from '../../../../shared/workout-engine.ts';
import type { Session as DashboardSession } from './progressDashboard';
import type { ApiGoal } from '../services/member4Service';

export function dashboardSessions(sessions: readonly Session[]): DashboardSession[] {
  return sessions.map(session => ({ id: session.id, title: session.snapshot.name,
    date: new Date(session.finishedAt ?? session.startedAt).toISOString().slice(0, 10),
    minutes: Math.round(session.elapsedMs / 6000) / 10, calories: 0,
    category: 'other' }));
}
export function longestStreak(sessions: readonly Session[]) {
  const days = [...new Set(sessions.filter(s => s.status === 'completed').map(s => new Date(s.finishedAt ?? s.startedAt).toISOString().slice(0, 10)))].sort();
  let longest = 0, streak = 0, previous = 0;
  for (const day of days) { const time = Date.parse(day); streak = time - previous === 86400000 ? streak + 1 : 1; longest = Math.max(longest, streak); previous = time; }
  return longest;
}

export function computeGoalProgress(apiGoal: ApiGoal, sessions: readonly Session[]): number {
  const isMonthly = apiGoal.duration === 'Monthly' || apiGoal.goalType === 'monthlyWorkouts';
  const windowMs = isMonthly ? 30 * 86400000 : 7 * 86400000;
  const now = Date.now();
  const windowStart = now - windowMs;

  const validSessions = sessions.filter(s => {
    if (!isFinished(s)) return false;
    const time = s.finishedAt ?? s.startedAt;
    if (time < windowStart) return false;
    if (apiGoal.endDate && time > new Date(apiGoal.endDate).getTime()) return false;
    return true;
  });

  switch (apiGoal.goalType) {
    case 'workoutMinutes': {
      const totalMs = validSessions.reduce((acc, s) => acc + (s.elapsedMs || 0), 0);
      if (totalMs <= 0) return 0;
      return Math.max(validSessions.length > 0 ? 1 : 0, Math.round(totalMs / 60000));
    }
    case 'workoutsPerWeek':
    case 'monthlyWorkouts': {
      return validSessions.length;
    }
    case 'caloriesPerWeek': {
      const totalMinutes = Math.round(validSessions.reduce((acc, s) => acc + (s.elapsedMs || 0), 0) / 60000);
      return Math.round(totalMinutes * 8.5);
    }
    default:
      return 0;
  }
}


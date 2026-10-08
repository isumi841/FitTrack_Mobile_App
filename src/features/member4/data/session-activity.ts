import type { Session } from '@/features/workout/engine';
import type { Session as DashboardSession } from './progressDashboard';

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

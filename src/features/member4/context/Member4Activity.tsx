import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '@/features/workout/api';
import { isFinished, type Session } from '@/features/workout/engine';
import { useWorkout } from '@/features/workout/store';
import { getGoals, type ApiGoal } from '../services/member4Service';
function useActivityState() {
  const { token, recordsVersion } = useWorkout();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<ApiGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [asOf, setAsOf] = useState(Date.now);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const [history, targets] = await Promise.all([api<{ sessions: Session[] }>('/workout-sessions', token), getGoals()]);
      if (generation.current !== request) return;
      setSessions(history.sessions.filter(isFinished)); setGoals(targets.data); setError(''); setAsOf(Date.now());
    } catch (err) { if (generation.current === request) setError(err instanceof Error ? err.message : 'Unable to load progress.'); }
    finally { if (generation.current === request) setLoading(false); }
  }, [token]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh, recordsVersion]);
  const stats = useMemo(() => {
    const since = asOf - 7 * 86400000;
    const week = sessions.filter(session => (session.finishedAt ?? session.startedAt) >= since);
    const weeklyTarget = goals.find(goal => goal.goalType === 'workoutsPerWeek' && goal.status === 'active')?.target ?? 0;
    return { workoutsCompleted: week.length, workoutsTarget: weeklyTarget, totalMinutes: Math.round(week.reduce((sum, session) => sum + session.elapsedMs, 0) / 60000),
      targetMinutes: goals.find(goal => goal.goalType === 'workoutMinutes' && goal.status === 'active')?.target ?? 0,
      caloriesBurned: 0, streakDays: 0, weeklyCompletionPct: weeklyTarget ? Math.min(100, Math.round(week.length / weeklyTarget * 100)) : 0 };
  }, [sessions, goals, asOf]);
  return { sessions, goals, stats, loading, error, refresh };
}
const Context = createContext<ReturnType<typeof useActivityState> | null>(null);
export function Member4ActivityProvider({ children }: { children: ReactNode }) {
  return <Context.Provider value={useActivityState()}>{children}</Context.Provider>;
}
export function useMember4Activity() {
  const value = useContext(Context);
  if (!value) throw new Error('Member4ActivityProvider is required.');
  return value;
}

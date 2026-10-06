import type { Workout } from '../src/features/workout/data';
// Pure transitions shared with the Node 24 API; no timers or storage side effects.
export type Session = {
  id: string; ownerId: string; workoutId: string; snapshot: Workout;
  startedAt: number; updatedAt: number; finishedAt?: number;
  status: 'running' | 'paused' | 'completed' | 'ended-early';
  phase: number; remainingMs: number; elapsedMs: number; workSeconds: number; restSeconds: number;
  completedSets: number; skippedSets: number; completedIntervals: number[]; skippedIntervals: number[]; note: string; revision: number;
};
export const totalSets = (s: Session) => s.snapshot.exercises.length * s.snapshot.rounds;
export const isFinished = (s: Session) => s.status === 'completed' || s.status === 'ended-early';
export function advance(session: Session, deltaMs: number, now: number): Session {
  if (session.status !== 'running' || deltaMs <= 0) return session;
  const s = { ...session };
  let delta = deltaMs;
  while (delta >= s.remainingMs && s.phase < totalSets(s) * 2) {
    delta -= s.remainingMs;
    s.elapsedMs += s.remainingMs;
    s.completedIntervals = [...s.completedIntervals, s.phase];
    if (s.phase % 2 === 0) s.completedSets += 1;
    s.phase += 1;
    if (s.phase === totalSets(s) * 2) return { ...s, status: 'completed', finishedAt: now, remainingMs: 0 };
    s.remainingMs = (s.phase % 2 === 0 ? s.workSeconds : s.restSeconds) * 1000;
  }
  s.remainingMs -= delta;
  s.elapsedMs += delta;
  return s;
}
export function skipMovement(session: Session, now: number): Session {
  if (session.status !== 'running') return session;
  const skipped = session.phase % 2 === 0 ? 1 : 0;
  const phase = Math.floor(session.phase / 2) * 2 + 2;
  const skippedIntervals = [...session.skippedIntervals, ...Array.from({ length: phase - session.phase }, (_, i) => session.phase + i)];
  if (phase >= totalSets(session) * 2) return { ...session, phase, skippedIntervals, skippedSets: session.skippedSets + skipped, status: 'completed', remainingMs: 0, finishedAt: now };
  return { ...session, phase, skippedIntervals, skippedSets: session.skippedSets + skipped, remainingMs: session.workSeconds * 1000 };
}
export const currentIndex = (s: Session) => Math.min(totalSets(s) - 1, Math.floor(s.phase / 2)) % s.snapshot.exercises.length;
export const currentRound = (s: Session) => Math.min(s.snapshot.rounds, Math.floor(s.phase / (s.snapshot.exercises.length * 2)) + 1);

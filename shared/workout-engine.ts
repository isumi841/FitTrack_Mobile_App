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
export function phaseSeconds(s: Session): number | null {
  if (s.phase % 2) return s.restSeconds;
  const duration = s.snapshot.exercises[currentIndex(s)].durationSeconds;
  return duration === undefined ? s.workSeconds : duration;
}
export const manualMovement = (s: Session) => !isFinished(s) && phaseSeconds(s) === null;
function nextPhase(s: Session, now: number): Session {
  const next = { ...s, phase: s.phase + 1 };
  // Managed workouts finish with their last exercise; no unnecessary final rest.
  if (next.phase >= totalSets(s) * 2 - (s.snapshot.managed ? 1 : 0)) {
    return { ...next, phase: totalSets(s) * 2, status: 'completed', finishedAt: now, remainingMs: 0 };
  }
  return { ...next, remainingMs: (phaseSeconds(next) ?? 0) * 1000 };
}
export function advance(session: Session, deltaMs: number, now: number): Session {
  if (session.status !== 'running' || deltaMs <= 0) return session;
  let s = { ...session };
  let delta = deltaMs;
  while (!manualMovement(s) && delta >= s.remainingMs && s.phase < totalSets(s) * 2) {
    delta -= s.remainingMs;
    s.elapsedMs += s.remainingMs;
    s.completedIntervals = [...s.completedIntervals, s.phase];
    if (s.phase % 2 === 0) s.completedSets += 1;
    s = nextPhase(s, now);
    if (isFinished(s)) return s;
  }
  if (!manualMovement(s)) s.remainingMs -= delta;
  s.elapsedMs += delta;
  return s;
}
export function completeMovement(session: Session, now: number): Session {
  if (session.status !== 'running' || !manualMovement(session)) return session;
  return nextPhase({ ...session, completedSets: session.completedSets + 1,
    completedIntervals: [...session.completedIntervals, session.phase] }, now);
}
export function skipMovement(session: Session, now: number): Session {
  if (session.status !== 'running') return session;
  const skipped = session.phase % 2 === 0 ? 1 : 0;
  const phase = Math.floor(session.phase / 2) * 2 + 2;
  const skippedIntervals = [...session.skippedIntervals, ...Array.from({ length: phase - session.phase }, (_, i) => session.phase + i)];
  if (phase >= totalSets(session) * 2) return { ...session, phase, skippedIntervals, skippedSets: session.skippedSets + skipped, status: 'completed', remainingMs: 0, finishedAt: now };
  const next = { ...session, phase, skippedIntervals, skippedSets: session.skippedSets + skipped };
  return { ...next, remainingMs: (phaseSeconds(next) ?? 0) * 1000 };
}
export const currentIndex = (s: Session) => Math.min(totalSets(s) - 1, Math.floor(s.phase / 2)) % s.snapshot.exercises.length;
export const currentRound = (s: Session) => Math.min(s.snapshot.rounds, Math.floor(s.phase / (s.snapshot.exercises.length * 2)) + 1);

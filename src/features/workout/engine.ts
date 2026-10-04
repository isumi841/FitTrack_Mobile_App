// Pure state transitions: no timers, navigation or storage side effects.
export type Session = {
  id: string; startedAt: number; finishedAt?: number; status: 'running' | 'paused' | 'completed' | 'ended';
  phase: number; remainingMs: number; elapsedMs: number; workSeconds: number; restSeconds: number;
  completedSets: number; skippedSets: number; note: string;
};
export const TOTAL_SETS = 15;
export function newSession(now: number, workSeconds: number, restSeconds: number): Session {
  return { id: `session-${now}`, startedAt: now, status: 'running', phase: 0, remainingMs: workSeconds * 1000, elapsedMs: 0, workSeconds, restSeconds, completedSets: 0, skippedSets: 0, note: '' };
}
export function advance(session: Session, deltaMs: number, now: number): Session {
  if (session.status !== 'running' || deltaMs <= 0) return session;
  const s = { ...session };
  let delta = deltaMs;
  while (delta >= s.remainingMs && s.phase < TOTAL_SETS * 2) {
    delta -= s.remainingMs;
    s.elapsedMs += s.remainingMs;
    if (s.phase % 2 === 0) s.completedSets += 1;
    s.phase += 1;
    if (s.phase === TOTAL_SETS * 2) return { ...s, status: 'completed', finishedAt: now, remainingMs: 0 };
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
  if (phase >= TOTAL_SETS * 2) return { ...session, phase, skippedSets: session.skippedSets + skipped, status: 'completed', remainingMs: 0, finishedAt: now };
  return { ...session, phase, skippedSets: session.skippedSets + skipped, remainingMs: session.workSeconds * 1000 };
}
export const currentIndex = (s: Session) => Math.min(14, Math.floor(s.phase / 2)) % 5;
export const currentRound = (s: Session) => Math.min(3, Math.floor(s.phase / 10) + 1);

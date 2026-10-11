// Only unambiguous durations become timers. Reps, sets and per-side targets
// stay manual so their meaning is never silently changed.
export function exerciseDuration(target: string): number | null {
  const match = target.trim().match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes)$/i);
  if (!match) return null;
  const seconds = Number(match[1]) * (/^m/i.test(match[2]) ? 60 : 1);
  return Number.isInteger(seconds) && seconds >= 1 && seconds <= 3600 ? seconds : null;
}

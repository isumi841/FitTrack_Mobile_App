export type Exercise = {
  id: string; name: string; subtitle: string; cue: string;
  steps: string[]; video: string | number | null;
};
export type Workout = {
  sessionReady?: true;
  id: string; name: string; description: string; level: string;
  equipment: string[]; sample: boolean; rounds: number;
  workSeconds: number; restSeconds: number; durationSeconds: number;
  exercises: Exercise[];
};
export const formatTime = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0')}:${Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0')}`;

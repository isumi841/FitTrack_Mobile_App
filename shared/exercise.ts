export type ManagedExercise = {
  id: string; workoutId: string; name: string; target: string;
  subtitle: string; cue: string; steps: string[]; video: string | null;
  position: number; revision: number; createdAt: number; updatedAt: number;
};
export type ExerciseInput = Pick<ManagedExercise, 'name' | 'target' | 'subtitle' | 'cue' | 'steps' | 'video' | 'position'>;

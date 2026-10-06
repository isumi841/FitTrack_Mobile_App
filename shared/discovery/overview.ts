import { member2Workouts } from './workouts.ts';

// An overview is not a runnable interval plan. Keep reps/targets verbatim until
// guidance, rounds, work/rest and repetition handling are defined by the team.
export const workoutOverviews = member2Workouts.map(workout => ({
  id: workout.id,
  name: workout.title,
  description: workout.description,
  level: workout.difficulty,
  category: workout.category,
  equipment: [workout.equipment],
  sample: false as const,
  sessionReady: false as const,
  durationSeconds: workout.duration * 60,
  lowImpact: workout.lowImpact,
  exercises: workout.exercises.map((exercise, index) => ({
    id: `${workout.id}-movement-${index + 1}`,
    name: exercise.title,
    target: exercise.target,
  })),
}));
export type WorkoutOverview = (typeof workoutOverviews)[number] & { guidanceManaged?: boolean };

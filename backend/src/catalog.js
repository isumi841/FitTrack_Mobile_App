// Temporary member 3 fixtures. Never seeded into shared workout collections.
const movements = [
  ['march', 'March in Place', 'Warm up legs & balance', 'Keep your steps light and controlled.', ['Stand tall with feet hip-width apart.', 'Lift one knee, then lower your foot gently.', 'Alternate legs at a comfortable pace.', 'Breathe steadily; use a wall for balance if needed.']],
  ['wall-push-ups', 'Wall Push-Ups', 'Gentle upper body strength', 'Slow, controlled movement.', ['Face a wall at arm’s length.', 'Place palms on the wall at chest height.', 'Bend elbows slowly, bringing your chest toward the wall.', 'Press back while keeping your body aligned.']],
  ['chair', 'Chair Sit-to-Stand', 'Lower body & core stability', 'Use a stable chair and move with control.', ['Place a sturdy chair against a wall.', 'Sit with feet flat and hip-width apart.', 'Lean slightly forward and stand.', 'Lower yourself slowly onto the seat.']],
  ['side-steps', 'Standing Side Steps', 'Balance & coordination', 'Small steps. Steady rhythm.', ['Stand with space on both sides.', 'Step right and bring the other foot alongside.', 'Repeat to the left.', 'Keep knees relaxed and move at your own pace.']],
  ['calf-raises', 'Calf Raises', 'Ankle & calf conditioning', 'Rise slowly, lower gently.', ['Stand near a wall for support.', 'Keep feet hip-width apart.', 'Lift both heels slowly.', 'Lower heels gently to the floor.']],
].map(([id, name, subtitle, cue, steps]) => ({ id, name, subtitle, cue, steps, video: null }));
function sample(id, name, description, level, equipment, indexes, rounds, workSeconds, restSeconds) {
  return { id, name, description, level, equipment, sample: true, rounds, workSeconds, restSeconds,
    exercises: indexes.map(i => movements[i]), durationSeconds: indexes.length * rounds * (workSeconds + restSeconds) };
}
export const workouts = [
  sample('sample-gentle-start', 'Sample: Gentle Start', 'A short introduction to movement.', 'Beginner', ['Wall'], [0, 3], 1, 20, 10),
  sample('sample-chair-strength', 'Sample: Chair Strength', 'Controlled strength with a stable chair and wall.', 'Beginner', ['Chair', 'Wall'], [1, 2, 4], 2, 30, 15),
  sample('sample-full-body', 'Sample: Full Body', 'A longer, gentle full-body routine.', 'Intermediate', ['Chair', 'Wall'], [0, 1, 2, 3, 4], 3, 40, 20),
];
export { workoutOverviews } from '../../shared/discovery/overview.ts';
import { workoutOverviews } from '../../shared/discovery/overview.ts';
export const findWorkout = id => workouts.find(workout => workout.id === id) ?? workoutOverviews.find(workout => workout.id === id);

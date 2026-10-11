// Shared form/API validation for the leader's workout metadata contract.
export const WORKOUT_CATEGORIES = ['Full Body', 'Strength', 'Cardio', 'Stretching', 'Mobility', 'Core'];
export const WORKOUT_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
export function validateAdminWorkout(value: unknown, partial = false): Record<string, unknown> {
  const fields = ['title', 'description', 'category', 'difficulty', 'duration', 'equipment', 'lowImpact', 'active', 'exercises'];
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Enter valid workout details.');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !fields.includes(key)) || !Object.keys(input).length) throw new Error('Invalid workout fields.');
  const output: Record<string, unknown> = {};
  const text = (value: unknown, label: string, max: number) => {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${label} must contain 1–${max} characters.`);
    return value.trim();
  };
  for (const [key, label, max] of [['title', 'Workout title', 120], ['description', 'Description', 2000], ['equipment', 'Equipment', 120]] as const) {
    if (partial && !(key in input)) continue;
    output[key] = text(key === 'equipment' && input[key] === undefined ? 'No equipment' : input[key], label, max);
  }
  for (const [key, options] of [['category', WORKOUT_CATEGORIES], ['difficulty', WORKOUT_DIFFICULTIES]] as const) {
    if (partial && !(key in input)) continue;
    if (typeof input[key] !== 'string' || !options.includes(input[key])) throw new Error(`Select a supported ${key}.`);
    output[key] = input[key];
  }
  if (!partial || 'duration' in input) {
    if (typeof input.duration !== 'number' || !Number.isSafeInteger(input.duration) || input.duration < 1 || input.duration > 1440) throw new Error('Duration must be a whole number from 1 to 1440 minutes.');
    output.duration = input.duration;
  }
  for (const key of ['lowImpact', 'active']) {
    if (partial && !(key in input)) continue;
    const flag = input[key] === undefined ? key === 'active' : input[key];
    if (typeof flag !== 'boolean') throw new Error(`Invalid ${key} value.`);
    output[key] = flag;
  }
  if (!partial || 'exercises' in input) {
    const exercises = input.exercises ?? [];
    if (!Array.isArray(exercises) || exercises.length > 50) throw new Error('Provide no more than 50 exercise targets.');
    output.exercises = exercises.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(key => !['title', 'target'].includes(key))) throw new Error('Invalid exercise target.');
      return { title: text(item.title, 'Exercise title', 100), target: text(item.target, 'Exercise target', 100) };
    });
  }
  return output;
}

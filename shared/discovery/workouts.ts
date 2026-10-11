import { workouts as sharedWorkouts } from "./base-workouts.ts";

export const workoutTypes = [
  "Full Body",
  "Strength",
  "Cardio",
  "Stretching",
  "Mobility",
  "Core",
] as const;
export const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;
export const durations = ["5", "15", "30", "45"] as const;
export type Exercise = { title: string; target: string };
export type Member2Workout = {
  id: string;
  title: string;
  category: (typeof workoutTypes)[number];
  difficulty: (typeof difficulties)[number];
  duration: number;
  equipment: string;
  description: string;
  lowImpact: boolean;
  exercises: Exercise[];
};
export type WorkoutFilters = Partial<
  Record<
    "duration" | "difficulty" | "category" | "equipment" | "lowImpact",
    string
  >
>;
export const beginnerExercises: Exercise[] = [
  { title: "Jumping Jacks", target: "30 sec · Step out for low impact" },
  { title: "Bodyweight Squats", target: "12 reps" },
  { title: "Wall Push-Ups", target: "10 reps" },
  { title: "Glute Bridges", target: "12 reps" },
  { title: "Standing Knee Raises", target: "30 sec" },
  { title: "Bird Dog", target: "10 reps" },
  { title: "Shoulder Stretch", target: "30 sec" },
  { title: "Deep Breathing", target: "1 min" },
];

// Reuse existing local records and favourite IDs; Member 1 data stays unchanged.
export const member2Workouts: Member2Workout[] = sharedWorkouts.map(
  (workout) => ({
    id: workout.id,
    title: workout.title,
    category:
      workout.category === "Strength"
        ? "Strength"
        : workout.category === "Yoga" || workout.category === "Mobility"
          ? "Stretching"
          : workout.category === "Full Body"
            ? "Full Body"
            : "Cardio",
    difficulty: workout.level === "Intermediate" ? "Intermediate" : "Beginner",
    duration: workout.duration,
    equipment: workout.equipment,
    description: workout.description,
    lowImpact: workout.category !== "HIIT" && workout.id !== "7",
    exercises:
      workout.id === "beginner-full-body"
        ? beginnerExercises
        : workout.exercises.map((title) => ({
            title,
            target: /warm|cool|breath|rest/i.test(title)
              ? "1 min"
              : "40 sec · Move at your pace",
          })),
  }),
);
member2Workouts.push(
  {
    id: "quick-cardio-burn",
    title: "Quick Cardio Burn",
    category: "Cardio",
    difficulty: "Intermediate",
    duration: 15,
    equipment: "No equipment",
    lowImpact: false,
    description:
      "A focused cardio circuit with short intervals and recovery breaks. Keep your own pace.",
    exercises: [
      { title: "Warm up", target: "2 min" },
      { title: "High Knees", target: "30 sec" },
      { title: "Skaters", target: "30 sec" },
      { title: "March and recover", target: "1 min" },
      { title: "Cool down", target: "2 min" },
    ],
  },
  {
    id: "power-full-body",
    title: "Full Body Power",
    category: "Full Body",
    difficulty: "Advanced",
    duration: 45,
    equipment: "Dumbbells",
    lowImpact: false,
    description:
      "A challenging full-body strength circuit. Use a suitable weight and take recovery breaks.",
    exercises: [
      { title: "Warm up", target: "5 min" },
      { title: "Goblet Squats", target: "12 reps" },
      { title: "Dumbbell Rows", target: "12 reps" },
      { title: "Reverse Lunges", target: "10 reps each side" },
      { title: "Floor Press", target: "12 reps" },
      { title: "Plank", target: "30 sec" },
      { title: "Cool down", target: "5 min" },
    ],
  },
  {
    id: "stretch-reset",
    title: "Stretch and Reset",
    category: "Stretching",
    difficulty: "Beginner",
    duration: 45,
    equipment: "Yoga mat",
    lowImpact: true,
    description:
      "Give yourself time to unwind with gentle stretches and relaxed breathing.",
    exercises: [
      { title: "Deep Breathing", target: "3 min" },
      { title: "Shoulder Stretch", target: "30 sec each side" },
      { title: "Hip Flexor Stretch", target: "45 sec each side" },
      { title: "Seated Forward Fold", target: "1 min" },
      { title: "Supine Twist", target: "1 min each side" },
      { title: "Rest", target: "5 min" },
    ],
  },
  {
    id: "daily-mobility-flow",
    title: "Daily Mobility Flow",
    category: "Mobility",
    difficulty: "Beginner",
    duration: 15,
    equipment: "No equipment",
    lowImpact: true,
    description:
      "A gentle full-body sequence to ease stiffness and build comfortable range of motion.",
    exercises: [
      { title: "Shoulder Rolls", target: "10 reps each direction" },
      { title: "Cat-Cow", target: "8 reps" },
      { title: "World's Greatest Stretch", target: "5 reps each side" },
      { title: "Hip Circles", target: "8 reps each side" },
      { title: "Ankle Rocks", target: "10 reps each side" },
    ],
  },
  {
    id: "lower-body-mobility",
    title: "Lower Body Mobility",
    category: "Mobility",
    difficulty: "Intermediate",
    duration: 30,
    equipment: "Yoga mat",
    lowImpact: true,
    description:
      "Improve hip, knee, and ankle movement with a controlled lower-body flow.",
    exercises: [
      { title: "90/90 Hip Switches", target: "8 reps each side" },
      { title: "World's Greatest Stretch", target: "6 reps each side" },
      { title: "Deep Squat Hold", target: "30 sec" },
      { title: "Hamstring Sweep", target: "10 reps each side" },
      { title: "Calf Mobility Rocks", target: "12 reps each side" },
    ],
  },
  {
    id: "beginner-core-builder",
    title: "Beginner Core Builder",
    category: "Core",
    difficulty: "Beginner",
    duration: 15,
    equipment: "No equipment",
    lowImpact: true,
    description:
      "Build a steady core foundation with simple, low-impact stability exercises.",
    exercises: [
      { title: "Dead Bug", target: "8 reps each side" },
      { title: "Glute Bridge", target: "12 reps" },
      { title: "Bird Dog", target: "8 reps each side" },
      { title: "Knee Plank", target: "20 sec" },
      { title: "Supine March", target: "10 reps each side" },
    ],
  },
  {
    id: "core-stability",
    title: "Core Stability",
    category: "Core",
    difficulty: "Intermediate",
    duration: 30,
    equipment: "Yoga mat",
    lowImpact: true,
    description:
      "Practice controlled anti-rotation and bracing for better stability and posture.",
    exercises: [
      { title: "Dead Bug", target: "10 reps each side" },
      { title: "Bird Dog", target: "10 reps each side" },
      { title: "Side Plank", target: "20 sec each side" },
      { title: "Glute Bridge March", target: "10 reps each side" },
      { title: "Forearm Plank", target: "30 sec" },
    ],
  },
);
export const recommendedWorkout = member2Workouts.find(
  (workout) => workout.id === "beginner-full-body",
)!;
export const categoryDetails = [
  {
    title: "Full Body",
    description: "Balanced workouts targeting your whole body.",
    ios: "figure.stand",
    material: "accessibility_new",
  },
  {
    title: "Strength",
    description: "Build strength with controlled, purposeful movement.",
    ios: "dumbbell",
    material: "fitness_center",
  },
  {
    title: "Cardio",
    description: "Get moving and build your cardiovascular endurance.",
    ios: "heart",
    material: "favorite",
  },
  {
    title: "Stretching",
    description: "Release tension and improve your flexibility.",
    ios: "figure.flexibility",
    material: "self_improvement",
  },
  {
    title: "Mobility",
    description: "Improve joint movement, flexibility and range of motion.",
    ios: "figure.mind.and.body",
    material: "accessibility_new",
  },
  {
    title: "Core",
    description: "Build core strength, stability and better posture.",
    ios: "figure.core.training",
    material: "fitness_center",
  },
] as const;

export function readWorkoutFilters(
  params: Record<string, string | string[] | undefined>,
): WorkoutFilters {
  const choices: Record<keyof WorkoutFilters, readonly string[]> = {
    duration: durations,
    difficulty: difficulties,
    category: workoutTypes,
    equipment: ["No equipment"],
    lowImpact: ["true"],
  };
  const filters: WorkoutFilters = {};
  for (const key of Object.keys(choices) as (keyof WorkoutFilters)[]) {
    const value = params[key];
    if (typeof value === "string" && choices[key].includes(value))
      filters[key] = value;
  }
  return filters;
}
export function matchingWorkouts(query = "", filters: WorkoutFilters = {}) {
  const search = query.trim().toLowerCase();
  return member2Workouts.filter(
    (workout) =>
      `${workout.title} ${workout.category} ${workout.difficulty} ${workout.equipment} ${workout.description}`
        .toLowerCase()
        .includes(search) &&
      (!filters.duration || String(workout.duration) === filters.duration) &&
      (!filters.difficulty || workout.difficulty === filters.difficulty) &&
      (!filters.category || workout.category === filters.category) &&
      (!filters.equipment || workout.equipment === filters.equipment) &&
      (!filters.lowImpact || workout.lowImpact),
  );
}
export function filterLabel(key: keyof WorkoutFilters, value: string) {
  return key === "duration"
    ? `${value} min`
    : key === "lowImpact"
      ? "Low Impact"
      : value;
}

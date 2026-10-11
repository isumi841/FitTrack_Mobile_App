export const categories = [
  "Strength",
  "Cardio",
  "Yoga",
  "HIIT",
  "Mobility",
  "Full Body",
  "Stretching",
];
export const focusAreas = ["Full body", "Upper body", "Lower body", "Core"];
export const equipmentOptions = ["No equipment", "Dumbbells", "Yoga mat"];
export type Filters = Partial<
  Record<"duration" | "category" | "focus" | "equipment", string>
>;
export type Workout = {
  id: string;
  title: string;
  category: string;
  duration: number;
  focus: string;
  equipment: string;
  level: string;
  description: string;
  exercises: string[];
};
export const beginnerWorkout: Workout = {
  id: "beginner-full-body",
  title: "Beginner Full Body",
  category: "Full Body",
  duration: 15,
  focus: "Full body",
  equipment: "No equipment",
  level: "Beginner",
  description:
    "A gentle guided routine tailored specifically for beginners. Build strength and flexibility safely.",
  exercises: [
    "Gentle warm up",
    "Chair squats",
    "Wall push-ups",
    "Standing knee raises",
    "Full body stretch",
  ],
};

export const workouts: Workout[] = [
  {
    id: "1",
    title: "Morning energy",
    category: "Cardio",
    duration: 5,
    focus: "Full body",
    equipment: "No equipment",
    level: "Beginner",
    description: "A quick, energizing session to get your whole body moving.",
    exercises: [
      "March in place",
      "Step jacks",
      "Standing knee raises",
      "Gentle cool down",
    ],
  },
  {
    id: "2",
    title: "Full body strength",
    category: "Strength",
    duration: 30,
    focus: "Full body",
    equipment: "Dumbbells",
    level: "Intermediate",
    description:
      "Build strength with a balanced mix of controlled movements. Choose a comfortable weight and rest when needed.",
    exercises: [
      "Warm up",
      "Goblet squats",
      "Dumbbell rows",
      "Floor press",
      "Cool down",
    ],
  },
  {
    id: "3",
    title: "Mindful morning flow",
    category: "Yoga",
    duration: 15,
    focus: "Full body",
    equipment: "Yoga mat",
    level: "Beginner",
    description: "Slow down, breathe, and move through a gentle flow.",
    exercises: ["Breathing", "Cat-cow", "Downward dog", "Low lunge", "Rest"],
  },
  {
    id: "4",
    title: "Express core",
    category: "HIIT",
    duration: 15,
    focus: "Core",
    equipment: "No equipment",
    level: "Intermediate",
    description:
      "A focused session for core stability with short recovery breaks.",
    exercises: [
      "Warm up",
      "Dead bugs",
      "Plank",
      "Mountain climbers",
      "Cool down",
    ],
  },
  {
    id: "5",
    title: "Move better",
    category: "Mobility",
    duration: 5,
    focus: "Upper body",
    equipment: "No equipment",
    level: "Beginner",
    description:
      "Release tension with gentle movements for your shoulders and upper back.",
    exercises: [
      "Shoulder circles",
      "Arm swings",
      "Thoracic rotations",
      "Relaxed breathing",
    ],
  },
  {
    id: "6",
    title: "Lower body builder",
    category: "Strength",
    duration: 45,
    focus: "Lower body",
    equipment: "Dumbbells",
    level: "Intermediate",
    description: "Develop lower body strength at a steady, controlled pace.",
    exercises: [
      "Warm up",
      "Squats",
      "Reverse lunges",
      "Romanian deadlifts",
      "Calf raises",
      "Cool down",
    ],
  },
  {
    id: "7",
    title: "Cardio endurance",
    category: "Cardio",
    duration: 30,
    focus: "Full body",
    equipment: "No equipment",
    level: "Intermediate",
    description: "Keep moving with a mix of accessible cardio intervals.",
    exercises: ["Warm up", "Step jacks", "High knees", "Skaters", "Cool down"],
  },
  {
    id: "8",
    title: "Upper body express",
    category: "Strength",
    duration: 15,
    focus: "Upper body",
    equipment: "Dumbbells",
    level: "Beginner",
    description:
      "A compact strength routine for your arms, shoulders, and back.",
    exercises: [
      "Warm up",
      "Rows",
      "Shoulder press",
      "Biceps curls",
      "Cool down",
    ],
  },
  {
    id: "9",
    title: "Evening unwind",
    category: "Yoga",
    duration: 30,
    focus: "Lower body",
    equipment: "Yoga mat",
    level: "Beginner",
    description: "Finish the day with a calm, spacious stretch session.",
    exercises: [
      "Breathing",
      "Seated fold",
      "Hip stretch",
      "Supine twist",
      "Rest",
    ],
  },
  beginnerWorkout,
];
export function readFilters(
  params: Record<string, string | string[] | undefined>,
): Filters {
  const result: Filters = {};
  const choices = {
    duration: ["5", "15", "30", "45"],
    category: categories,
    focus: focusAreas,
    equipment: equipmentOptions,
  };
  for (const key of Object.keys(choices) as (keyof Filters)[]) {
    const value = params[key];
    if (typeof value === "string" && choices[key].includes(value))
      result[key] = value;
  }
  return result;
}
export function findWorkouts(query = "", filters: Filters = {}) {
  const search = query.trim().toLowerCase();
  return workouts.filter(
    (w) =>
      `${w.title} ${w.category} ${w.focus} ${w.equipment}`
        .toLowerCase()
        .includes(search) &&
      (!filters.duration || String(w.duration) === filters.duration) &&
      (!filters.category ||
        (filters.category === "Full Body"
          ? w.focus === "Full body"
          : filters.category === "Stretching"
            ? w.category === "Yoga" || w.category === "Mobility"
            : w.category === filters.category)) &&
      (!filters.focus || w.focus === filters.focus) &&
      (!filters.equipment || w.equipment === filters.equipment),
  );
}

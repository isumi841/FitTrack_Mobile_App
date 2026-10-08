import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  difficulties,
  durations,
  readWorkoutFilters,
  workoutTypes,
  type WorkoutFilters,
} from "../../data/member2-workouts";
import {
  FilterChip,
  WorkoutButton,
  WorkoutScreenFrame,
  WorkoutSurface,
  WorkoutText,
  workoutStyles,
} from "../../components/workouts/workout-ui";
import { useWorkouts } from '@/features/discovery/use-workouts';
import { WorkoutLoadState } from '@/features/discovery/workout-load-state';

export default function WorkoutFilterScreen() {
  const params = useLocalSearchParams();
  const [filters, setFilters] = useState<WorkoutFilters>(() =>
    readWorkoutFilters(params),
  );
  const query = typeof params.query === "string" ? params.query : "";
  const toggle = (key: Extract<keyof WorkoutFilters, string>, value: string) =>
    setFilters((previous: WorkoutFilters): WorkoutFilters => {
      const next = { ...previous };
      if (next[key] === value) delete next[key];
      else next[key] = value;
      return next;
    });
  const section = (
    title: string,
    key: Extract<keyof WorkoutFilters, string>,
    choices: readonly string[],
  ) => (
    <View key={String(key)} style={{ gap: 10 }}>
      <WorkoutText weight="semibold" style={workoutStyles.sectionTitle}>
        {title}
      </WorkoutText>
      <View style={workoutStyles.chips}>
        {choices.map((value) => (
          <FilterChip
            key={value}
            title={key === "duration" ? `${value} min` : value}
            selected={filters[key] === value}
            onPress={() => toggle(key, value)}
          />
        ))}
      </View>
    </View>
  );
  const resource = useWorkouts(query, filters);
  return (
    <WorkoutScreenFrame
      title="Workout Filter"
      subtitle="Find the right workout for your day."
    >
      <WorkoutText weight="medium" style={{ fontSize: 10 }}>
        Custom session
      </WorkoutText>
      {section("Duration", "duration", durations)}
      {section("Difficulty", "difficulty", difficulties)}
      {section("Workout Type", "category", workoutTypes)}
      <WorkoutSurface>
        <WorkoutText weight="semibold" style={workoutStyles.sectionTitle}>
          Preferences
        </WorkoutText>
        <View style={workoutStyles.chips}>
          <FilterChip
            title="No Equipment"
            selected={filters.equipment === "No equipment"}
            onPress={() => toggle("equipment", "No equipment")}
          />
          <FilterChip
            title="Low Impact"
            selected={filters.lowImpact === "true"}
            onPress={() => toggle("lowImpact", "true")}
          />
        </View>
      </WorkoutSurface>
      <WorkoutLoadState {...resource} />
      {!resource.loading && !resource.error && <WorkoutText muted>{resource.items.length} workouts match your preferences</WorkoutText>}
      <WorkoutButton title="Reset" secondary onPress={() => setFilters({})} />
      <WorkoutButton
        title="Show Results"
        onPress={() =>
          router.push({
            pathname: "/member2/filtered-results",
            params: { ...filters, query },
          })
        }
      />
    </WorkoutScreenFrame>
  );
}

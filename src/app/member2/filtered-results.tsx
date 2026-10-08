import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  filterLabel,
  readWorkoutFilters,
  type WorkoutFilters,
} from "@/data/member2-workouts";
import {
  FilterChip,
  WorkoutButton,
  WorkoutList,
  WorkoutScreenFrame,
  WorkoutSearch,
  WorkoutText,
  workoutStyles,
} from "@/components/workouts/workout-ui";
import { useWorkouts } from '@/features/discovery/use-workouts';
import { WorkoutLoadState } from '@/features/discovery/workout-load-state';

export default function FilteredResultsScreen() {
  const params = useLocalSearchParams();
  const filters = readWorkoutFilters(params);
  const [query, setQuery] = useState(
    typeof params.query === "string" ? params.query : "",
  );
  const resource = useWorkouts(query, filters);
  const { items, loading, error } = resource;
  const openFilters = () =>
    router.push({
      pathname: "/member2/workout-filter",
      params: { ...filters, query },
    });
  return (
    <WorkoutScreenFrame
      title="Workout Results"
      subtitle={loading || error ? 'Find a workout for you' : `${items.length} workouts match your preferences`}
    >
      <WorkoutSearch value={query} onChange={setQuery} onFilter={openFilters} />
      <View style={workoutStyles.chips}>
        {(Object.keys(filters) as (keyof WorkoutFilters)[]).map((key) => (
          <FilterChip
            key={key}
            title={`${filterLabel(key, filters[key]!)} ×`}
            selected
            onPress={() => router.setParams({ [key]: "" })}
          />
        ))}
      </View>
      {!Object.keys(filters).length && (
        <WorkoutText muted>All workouts · No filters applied</WorkoutText>
      )}

      <WorkoutButton title="Change Filters" secondary onPress={openFilters} />
      <WorkoutButton
        title="Clear All"
        secondary
        onPress={() => {
          router.setParams({
            duration: "",
            difficulty: "",
            category: "",
            equipment: "",
            lowImpact: "",
          });
          setQuery("");
        }}
      />
      <WorkoutLoadState {...resource} />
      {!loading && !error && <WorkoutList workouts={items} />}
    </WorkoutScreenFrame>
  );
}

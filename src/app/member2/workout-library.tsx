import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  matchingWorkouts,
  readWorkoutFilters,
  workoutTypes,
} from "@/data/member2-workouts";
import {
  FilterChip,
  WorkoutList,
  WorkoutScreenFrame,
  WorkoutSearch,
  WorkoutText,
  workoutStyles,
} from "@/components/workouts/workout-ui";

export default function WorkoutLibraryScreen() {
  const params = useLocalSearchParams();
  const filters = readWorkoutFilters(params);
  const [query, setQuery] = useState(
    typeof params.query === "string" ? params.query : "",
  );
  const items = matchingWorkouts(query, filters);
  return (
    <WorkoutScreenFrame
      title="Workout Library"
      subtitle="Make your next session count."
    >
      <WorkoutSearch
        value={query}
        onChange={setQuery}
        onFilter={() =>
          router.push({
            pathname: "/member2/workout-filter",
            params: { ...filters, query },
          })
        }
      />
      <View style={workoutStyles.chips}>
        <FilterChip
          title="All"
          selected={!filters.category}
          onPress={() => router.setParams({ category: "" })}
        />
        {workoutTypes.map((category) => (
          <FilterChip
            key={category}
            title={category}
            selected={filters.category === category}
            onPress={() => router.setParams({ category })}
          />
        ))}
      </View>
      <WorkoutText muted>
        {items.length} workouts · All levels welcome
      </WorkoutText>
      <WorkoutList workouts={items} />
    </WorkoutScreenFrame>
  );
}

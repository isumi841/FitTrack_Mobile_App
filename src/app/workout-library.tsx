import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Chip,
  Label,
  Screen,
  Search,
  ui,
  WorkoutList,
} from "@/components/member-ui";
import { categories, findWorkouts, readFilters } from "@/data/workouts";

export default function WorkoutLibraryScreen() {
  const params = useLocalSearchParams();
  const filters = readFilters(params);
  const [query, setQuery] = useState(
    typeof params.query === "string" ? params.query : "",
  );
  const items = findWorkouts(query, filters);
  return (
    <Screen
      title="Workout library"
      subtitle="Your next favourite workout starts here."
    >
      <Search value={query} onChangeText={setQuery} />
      <View style={ui.chips}>
        <Chip
          title="All"
          selected={!filters.category}
          onPress={() => router.setParams({ category: "" })}
        />
        {categories.map((category) => (
          <Chip
            key={category}
            title={category}
            selected={filters.category === category}
            onPress={() => router.setParams({ category })}
          />
        ))}
      </View>
      <Button
        title="Filter workouts"
        icon="☷"
        soft
        onPress={() =>
          router.push({ pathname: "/workout-filter", params: filters })
        }
      />
      <Label muted>{items.length} workouts</Label>
      <WorkoutList items={items} />
    </Screen>
  );
}

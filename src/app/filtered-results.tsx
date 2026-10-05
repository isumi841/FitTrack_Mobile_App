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
import { findWorkouts, readFilters, type Filters } from "@/data/workouts";

export default function FilteredResultsScreen() {
  const params = useLocalSearchParams();
  const filters = readFilters(params);
  const [query, setQuery] = useState("");
  const items = findWorkouts(query, filters);
  return (
    <Screen
      title="Your workout matches"
      subtitle="A routine that fits your day."
    >
      <View style={ui.chips}>
        {(Object.keys(filters) as (keyof Filters)[]).map((key) => (
          <Chip
            key={key}
            title={`${key === "duration" ? `${filters[key]} min` : filters[key]} ×`}
            selected
            onPress={() => router.setParams({ [key]: "" })}
          />
        ))}
      </View>
      {!Object.keys(filters).length && (
        <Label muted>All workouts · No filters applied</Label>
      )}
      <Search value={query} onChangeText={setQuery} />
      <Button
        title="Clear All"
        soft
        onPress={() => {
          router.setParams({
            duration: "",
            category: "",
            focus: "",
            equipment: "",
          });
          setQuery("");
        }}
      />
      <View style={ui.row}>
        <Button
          title="Add Filter"
          soft
          onPress={() =>
            router.push({ pathname: "/workout-filter", params: filters })
          }
        />
        <Button
          title="Change Filters"
          soft
          onPress={() =>
            router.push({ pathname: "/workout-filter", params: filters })
          }
        />
      </View>
      <Label muted>{items.length} workouts found</Label>
      <WorkoutList items={items} />
    </Screen>
  );
}

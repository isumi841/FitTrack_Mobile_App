import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Chip, Label, Screen, ui } from "@/components/member-ui";
import {
  categories,
  equipmentOptions,
  findWorkouts,
  focusAreas,
  readFilters,
  type Filters,
} from "@/data/workouts";

export default function WorkoutFilterScreen() {
  const params = useLocalSearchParams();
  const [filters, setFilters] = useState<Filters>(() => readFilters(params));
  const toggle = (key: keyof Filters, value: string) =>
    setFilters((previous) => {
      const next = { ...previous };
      if (next[key] === value) delete next[key];
      else next[key] = value;
      return next;
    });
  const group = (title: string, key: keyof Filters, values: string[]) => (
    <Card key={key}>
      <Label large>{title}</Label>
      <View style={ui.chips}>
        {values.map((value) => (
          <Chip
            key={value}
            title={key === "duration" ? `${value} min` : value}
            selected={filters[key] === value}
            onPress={() => toggle(key, value)}
          />
        ))}
      </View>
    </Card>
  );
  const count = findWorkouts("", filters).length;
  return (
    <Screen title="Find your workout" subtitle="Choose what works for you.">
      {group("How much time do you have?", "duration", ["5", "15", "30", "45"])}
      {group("Workout type", "category", categories)}
      {group("Focus area", "focus", focusAreas)}
      {group("Equipment", "equipment", equipmentOptions)}
      <Button title="Reset All" soft onPress={() => setFilters({})} />
      <Button
        title={`Show ${count} Results`}
        onPress={() =>
          router.push({ pathname: "/filtered-results", params: filters })
        }
      />
    </Screen>
  );
}

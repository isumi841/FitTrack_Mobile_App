import { Button, Card, Label, Screen, Search } from "@/components/member-ui";
import { categories, workouts } from "@/data/workouts";
import { router } from "expo-router";
import { useState } from "react";

export default function WorkoutCategoriesScreen() {
  const [query, setQuery] = useState("");
  const matches = categories.filter((category) =>
    category.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Screen title="Workout categories" subtitle="Find your way to move.">
      <Search
        placeholder="Search categories"
        value={query}
        onChangeText={setQuery}
      />
      {matches.map((category) => (
        <Card key={category}>
          <Label large>{category}</Label>
          <Label muted>
            {workouts.filter((workout) => workout.category === category).length}{" "}
            workouts · All levels welcome
          </Label>
          <Button
            title={`Explore ${category}`}
            onPress={() =>
              router.push({
                pathname: "/workout-library",
                params: { category },
              })
            }
          />
        </Card>
      ))}
      {!matches.length && (
        <Label>No categories found. Try another search.</Label>
      )}
    </Screen>
  );
}

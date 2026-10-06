import { useState } from "react";
import { View } from "react-native";
import { categoryDetails } from "@/data/member2-workouts";
import {
  CategoryCard,
  FilterChip,
  WorkoutScreenFrame,
  WorkoutSearch,
  WorkoutText,
  workoutStyles,
} from "@/components/workouts/workout-ui";

export default function WorkoutCategoriesScreen() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const search = query.trim().toLowerCase();
  const categories = categoryDetails.filter(
    (category) =>
      (!selectedCategory || category.title === selectedCategory) &&
      `${category.title} ${category.description}`.toLowerCase().includes(search),
  );

  return (
    <WorkoutScreenFrame title="Workout Categories">
      <WorkoutSearch value={query} onChange={setQuery} />
      <View style={workoutStyles.chips}>
        <FilterChip
          title="All Types"
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
        />
        {categoryDetails.map((category) => (
          <FilterChip
            key={category.title}
            title={category.title}
            selected={selectedCategory === category.title}
            onPress={() =>
              setSelectedCategory((current) =>
                current === category.title ? null : category.title,
              )
            }
          />
        ))}
      </View>
      <View style={workoutStyles.grid}>
        {categories.map((category) => (
          <CategoryCard key={category.title} category={category} />
        ))}
      </View>
      {!categories.length && (
        <WorkoutText muted>
          No categories found. Try another search or category.
        </WorkoutText>
      )}
    </WorkoutScreenFrame>
  );
}

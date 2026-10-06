import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import {
  readWorkoutFilters,
  workoutTypes,
  type Member2Workout,
} from "@/data/member2-workouts";

import {
  FilterChip,
  WorkoutList,
  WorkoutScreenFrame,
  WorkoutSearch,
  WorkoutText,
  workoutStyles,
} from "@/components/workouts/workout-ui";

const API_URL = "http://localhost:5000/api/member2/workouts";

type ApiWorkout = {
  _id: string;
  title: string;
  category: Member2Workout["category"];
  difficulty: Member2Workout["difficulty"];
  duration: number;
  equipment: string;
  description: string;
  lowImpact: boolean;
  exercises?: Member2Workout["exercises"];
};

export default function WorkoutLibraryScreen() {
  const params = useLocalSearchParams();
  const filters = readWorkoutFilters(params);

  const [query, setQuery] = useState(
    typeof params.query === "string" ? params.query : "",
  );

  const [items, setItems] = useState<Member2Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        setLoading(true);
        setError("");

        const queryParams: string[] = [];

        if (query.trim()) {
          queryParams.push(
            `search=${encodeURIComponent(query.trim())}`,
          );
        }

        if (filters.category) {
          queryParams.push(
            `category=${encodeURIComponent(filters.category)}`,
          );
        }

        if (filters.difficulty) {
          queryParams.push(
            `difficulty=${encodeURIComponent(filters.difficulty)}`,
          );
        }

        if (filters.duration) {
          queryParams.push(
            `duration=${encodeURIComponent(filters.duration)}`,
          );
        }

        if (filters.equipment) {
          queryParams.push(
            `equipment=${encodeURIComponent(filters.equipment)}`,
          );
        }

        if (filters.lowImpact) {
          queryParams.push("lowImpact=true");
        }

        const url =
          queryParams.length > 0
            ? `${API_URL}?${queryParams.join("&")}`
            : API_URL;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to load workouts");
        }

        const result = await response.json();

        const workouts: Member2Workout[] = (
          result.data ?? []
        ).map((workout: ApiWorkout) => ({
          id: workout._id,
          title: workout.title,
          category: workout.category,
          difficulty: workout.difficulty,
          duration: workout.duration,
          equipment: workout.equipment,
          description: workout.description,
          lowImpact: workout.lowImpact,
          exercises: workout.exercises ?? [],
        }));

        setItems(workouts);
      } catch (err) {
        console.error("Workout API error:", err);
        setError("Unable to load workouts.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, [
    query,
    filters.category,
    filters.difficulty,
    filters.duration,
    filters.equipment,
    filters.lowImpact,
  ]);

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
            params: {
              ...filters,
              query,
            },
          })
        }
      />

      <View style={workoutStyles.chips}>
        <FilterChip
          title="All"
          selected={!filters.category}
          onPress={() =>
            router.setParams({
              category: "",
            })
          }
        />

        {workoutTypes.map((category) => (
          <FilterChip
            key={category}
            title={category}
            selected={
              filters.category === category
            }
            onPress={() =>
              router.setParams({
                category,
              })
            }
          />
        ))}
      </View>

      {loading ? (
        <WorkoutText muted>
          Loading workouts...
        </WorkoutText>
      ) : error ? (
        <WorkoutText muted>
          {error}
        </WorkoutText>
      ) : (
        <>
          <WorkoutText muted>
            {items.length} workouts · All levels welcome
          </WorkoutText>

          <WorkoutList workouts={items} />
        </>
      )}
    </WorkoutScreenFrame>
  );
}
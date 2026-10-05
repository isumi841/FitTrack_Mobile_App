import { useLocalSearchParams } from "expo-router";
import { Button, Card, Label, Screen } from "@/components/member-ui";
import { workouts } from "@/data/workouts";
import { useMember } from "@/providers/member-state";
import { startWorkout } from "@/utils/integration";

export default function WorkoutOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = workouts.find((item) => item.id === id);
  const { favorites, toggleFavorite } = useMember();
  if (!workout)
    return (
      <Screen title="Workout unavailable">
        <Label>
          This workout could not be found. Go back to choose another workout.
        </Label>
      </Screen>
    );
  const saved = favorites.includes(workout.id);
  return (
    <Screen
      title={workout.title}
      subtitle={`${workout.category} · ${workout.duration} minutes`}
    >
      <Card>
        <Label large>{workout.level}</Label>
        <Label muted>
          {workout.focus} · {workout.equipment}
        </Label>
        <Label>{workout.description}</Label>
      </Card>
      <Button
        title={saved ? "Remove from favourites" : "Add to favourites"}
        soft
        onPress={() => toggleFavorite(workout.id)}
      />
      <Label large>Your session</Label>
      {workout.exercises.map((exercise, index) => (
        <Card key={exercise}>
          <Label>
            {String(index + 1).padStart(2, "0")} · {exercise}
          </Label>
        </Card>
      ))}
      <Card>
        <Label large>Before you begin</Label>
        <Label muted>
          Make space to move, keep water nearby, and take breaks whenever you
          need them.
        </Label>
      </Card>
      <Button title="Start Workout" onPress={() => startWorkout(workout.id)} />
    </Screen>
  );
}

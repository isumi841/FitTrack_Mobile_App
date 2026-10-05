import { useLocalSearchParams } from "expo-router";
import {
  WorkoutButton,
  WorkoutScreenFrame,
  WorkoutSurface,
  WorkoutText,
  workoutStyles,
} from "@/components/workouts/workout-ui";
import { member2Workouts } from "@/data/member2-workouts";
import { useMember } from "@/providers/member-state";
import { startWorkout } from "@/utils/integration";

export default function Member2WorkoutOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = member2Workouts.find((item) => item.id === id);
  const { favorites, toggleFavorite } = useMember();

  if (!workout) {
    return (
      <WorkoutScreenFrame title="Workout unavailable">
        <WorkoutText muted>
          This workout could not be found. Go back to choose another workout.
        </WorkoutText>
      </WorkoutScreenFrame>
    );
  }

  const saved = favorites.includes(workout.id);
  return (
    <WorkoutScreenFrame
      title={workout.title}
      subtitle={`${workout.category} · ${workout.duration} minutes`}
    >
      <WorkoutSurface>
        <WorkoutText weight="semibold">{workout.difficulty}</WorkoutText>
        <WorkoutText muted>
          {workout.equipment} · {workout.lowImpact ? "Low impact" : "Standard"}
        </WorkoutText>
        <WorkoutText>{workout.description}</WorkoutText>
      </WorkoutSurface>
      <WorkoutButton
        title={saved ? "Remove from favourites" : "Add to favourites"}
        secondary
        onPress={() => toggleFavorite(workout.id)}
      />
      <WorkoutText weight="semibold" style={workoutStyles.sectionTitle}>
        Your session
      </WorkoutText>
      {workout.exercises.map((exercise, index) => (
        <WorkoutSurface key={`${workout.id}-${exercise.title}`}>
          <WorkoutText>
            {String(index + 1).padStart(2, "0")} · {exercise.title}
          </WorkoutText>
          <WorkoutText muted>{exercise.target}</WorkoutText>
        </WorkoutSurface>
      ))}
      <WorkoutSurface>
        <WorkoutText weight="semibold">Before you begin</WorkoutText>
        <WorkoutText muted>
          Make space to move, keep water nearby, and take breaks whenever you
          need them.
        </WorkoutText>
      </WorkoutSurface>
      <WorkoutButton
        title="Start Workout"
        onPress={() => startWorkout(workout.id)}
      />
    </WorkoutScreenFrame>
  );
}

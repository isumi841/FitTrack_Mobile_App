import { useEventListener } from "expo";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useState } from "react";
import { Text } from "react-native";
import {
    type Exercise,
} from "../../features/workout/data";
import { useWorkout } from "../../features/workout/store";
import { useExerciseSource } from '../../features/workout/resources';
import {
    Badge,
    Button,
    Card,
    Page,
    c,
    s,
} from "../../features/workout/ui";
function Player({ exercise }: { exercise: Exercise }) {
  const { markViewed } = useWorkout();
  const [error, setError] = useState("");
  const player = useVideoPlayer(exercise.video);
  useEventListener(player, "playToEnd", () => markViewed(exercise.id));
  useEventListener(player, "statusChange", (event) =>
    setError(
      event.status === "error"
        ? "This video could not be played. Check your connection or use the written steps."
        : "",
    ),
  );
  useFocusEffect(
    useCallback(
      () => () => {
        player.pause();
      },
      [player],
    ),
  );
  return (
    <>
      <VideoView
        player={player}
        nativeControls
        fullscreenOptions={{ enable: true }}
        style={{
          width: "100%",
          height: 240,
          backgroundColor: c.surface,
          borderRadius: 20,
        }}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={s.body}>
          {error}
        </Text>
      )}
    </>
  );
}
export default function VideoDemonstrationScreen() {
  const params = useLocalSearchParams<{ exercise?: string; workoutId?: string; sessionId?: string }>();
  const { workout, error, loading, retry } = useExerciseSource(params.workoutId, params.sessionId);
  const exercise = workout?.exercises.find((e) => e.id === params.exercise);
  const { data } = useWorkout();
  if (!exercise) return <Page title="Video demonstration"><Text style={s.body}>{loading ? 'Loading exercise…' : error || 'Exercise not found in this workout.'}</Text><Button title="Retry" onPress={retry} /></Page>;
  return (
    <Page title="Video Demonstration">
      <Badge>VIDEO GUIDANCE</Badge>
      {exercise.video ? (
        <Player key={exercise.id} exercise={exercise} />
      ) : (
        <Card>
          <Text style={s.heading}>Video not available yet</Text>
          <Text style={s.body}>
            You can still follow the written instructions for this movement.
          </Text>
        </Card>
      )}
      <Text style={s.title}>{exercise.name} Technique</Text>
      <Text style={s.body}>{exercise.cue}</Text>
      <Text style={s.body}>{exercise.steps.join(" ")}</Text>
      {data.viewed[exercise.id] && <Badge>✓ DEMONSTRATION WATCHED</Badge>}
      <Button
        title="Read step-by-step instructions"
        secondary
        onPress={() =>
          router.replace({
            pathname: "/workout/instructions",
            params: { exercise: exercise.id, ...(params.workoutId ? { workoutId: params.workoutId } : {}), ...(params.sessionId ? { sessionId: params.sessionId } : {}) },
          })
        }
      />
      <Button
        title="Return to Workout"
        onPress={() =>
          router.replace(
            params.sessionId && data.session?.id === params.sessionId && data.session?.status === "paused"
              ? "/workout/pause"
              : params.sessionId && data.session?.id === params.sessionId && data.session?.status === "running"
                ? "/workout/active"
                : params.sessionId
                  ? { pathname: '/workout/completed', params: { sessionId: params.sessionId } }
                  : { pathname: '/workout/details', params: { workoutId: params.workoutId } },
          )
        }
      />
    </Page>
  );
}

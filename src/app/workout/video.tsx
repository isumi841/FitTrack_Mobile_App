import { useEventListener } from "expo";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useState } from "react";
import { Text } from "react-native";
import {
    exercises,
    type Exercise,
} from "../../features/workout/data";
import { useWorkout } from "../../features/workout/store";
import {
    Badge,
    Button,
    Card,
    Figure,
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
  const params = useLocalSearchParams<{ exercise?: string }>();
  const exercise =
    exercises.find((e) => e.id === params.exercise) ?? exercises[0];
  const { data } = useWorkout();
  return (
    <Page title="Video Demonstration">
      <Badge>VIDEO GUIDANCE</Badge>
      {exercise.video ? (
        <Player key={exercise.id} exercise={exercise} />
      ) : (
        <Card>
          <Figure id={exercise.id} />
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
            params: { exercise: exercise.id },
          })
        }
      />
      <Button
        title="Return to Workout"
        onPress={() =>
          router.replace(
            data.session?.status === "paused"
              ? "/workout/pause"
              : data.session?.status === "running"
                ? "/workout/active"
                : "/workout/details",
          )
        }
      />
    </Page>
  );
}

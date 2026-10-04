import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
    exercises,
    workout,
} from "../../features/workout/data";
import { useWorkout } from "../../features/workout/store";
import {
    Badge,
    Button,
    Card,
    Figure,
    Page,
    s,
} from "../../features/workout/ui";
export default function WorkoutDetailsScreen() {
  const { data, start, toggleSaved } = useWorkout();
  const unfinished =
    data.session && ["running", "paused"].includes(data.session.status);
  return (
    <Page title="Workout Details" back={false}>
      <Card>
        <View style={s.row}>
          <Figure small />
          <View style={{ flex: 1, gap: 8 }}>
            <Badge>BEGINNER</Badge>
            <Text style={s.heading}>{workout.name}</Text>
            <Text style={s.body}>
              {Math.round(
                (15 * (data.settings.workSeconds + data.settings.restSeconds)) /
                  60,
              )}{" "}
              min · 3 rounds
            </Text>
          </View>
        </View>
      </Card>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={s.label}>EQUIPMENT</Text>
            <Text style={s.smallStrong}>Chair & wall</Text>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={s.label}>STRUCTURE</Text>
            <Text style={s.smallStrong}>
              {data.settings.workSeconds}s work / {data.settings.restSeconds}s
              rest
            </Text>
          </Card>
        </View>
      </View>
      <Text style={s.heading}>Welcome to Home Fitness!</Text>
      <Text style={s.body}>
        A gentle full-body routine with five simple movements across three
        rounds. You will need a sturdy chair and a wall.
      </Text>
      <Text style={s.heading}>Exercise List (5 Movements)</Text>
      {exercises.map((e, i) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          accessibilityLabel={`View instructions for ${e.name}`}
          onPress={() =>
            router.push({
              pathname: "/workout/instructions",
              params: { exercise: e.id },
            })
          }
        >
          <Card>
            <View style={s.row}>
              <Text style={s.number}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.smallStrong}>{e.name}</Text>
                <Text style={s.body}>{e.subtitle}</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </View>
          </Card>
        </Pressable>
      ))}
      <Button
        title={unfinished ? "Return to current workout" : "Start Workout →"}
        onPress={() => {
          if (!unfinished) start();
          router.push(
            data.session?.status === "paused"
              ? "/workout/pause"
              : "/workout/active",
          );
        }}
      />
      <Button
        title={
          data.saved
            ? "✓ Saved — remove from saved workouts"
            : "Save this workout"
        }
        onPress={toggleSaved}
        secondary
      />
      <Button
        title="Timer settings"
        onPress={() => router.push("/workout/timer")}
        secondary
      />
      <Button
        title={`Notifications (${data.notices.filter((n) => !n.read).length} unread)`}
        onPress={() => router.push("/workout/notifications")}
        secondary
      />
      {!!data.history.length && (
        <Button
          title="View latest session summary"
          onPress={() =>
            router.push({
              pathname: "/workout/completed",
              params: { session: data.history[0].id },
            })
          }
          secondary
        />
      )}
    </Page>
  );
}

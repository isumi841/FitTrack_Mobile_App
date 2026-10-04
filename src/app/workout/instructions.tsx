import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { exercises } from "../../features/workout/data";
import { useWorkout } from "../../features/workout/store";
import {
    Badge,
    Button,
    Card,
    Figure,
    Page,
    s,
} from "../../features/workout/ui";
export default function ExerciseInstructionsScreen() {
  const params = useLocalSearchParams<{ exercise?: string }>();
  const exercise =
    exercises.find((e) => e.id === params.exercise) ?? exercises[0];
  return <Instructions key={exercise.id} id={exercise.id} />;
}
function Instructions({ id }: { id: string }) {
  const exercise = exercises.find((e) => e.id === id)!;
  const { data, start, saveNote } = useWorkout();
  const [note, setNote] = useState(data.notes[id] ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <Page title="How to perform">
      <Card>
        <Badge>
          BEGINNER · MOVEMENT {exercises.indexOf(exercise) + 1} OF 5
        </Badge>
        <Text style={s.title}>{exercise.name}</Text>
        <Figure id={id} />
        <Text style={s.smallStrong}>Cue: “{exercise.cue}”</Text>
      </Card>
      <Text style={s.heading}>Instructions</Text>
      {exercise.steps.map((step, i) => (
        <View style={[s.row, { alignItems: "flex-start" }]} key={step}>
          <Text style={s.number}>{i + 1}</Text>
          <Text style={[s.body, { flex: 1 }]}>{step}</Text>
        </View>
      ))}
      <Button
        title="Watch Video Demo"
        onPress={() =>
          router.push({ pathname: "/workout/video", params: { exercise: id } })
        }
      />
      <Button
        title={
          data.session && ["running", "paused"].includes(data.session.status)
            ? "Return to Workout"
            : "Start Workout"
        }
        onPress={() => {
          start();
          router.replace(
            data.session?.status === "paused"
              ? "/workout/pause"
              : "/workout/active",
          );
        }}
        secondary
      />
      <Card>
        <Text style={s.heading}>My exercise note</Text>
        <TextInput
          accessibilityLabel="My exercise note"
          placeholder="Add a reminder for next time…"
          placeholderTextColor="#667A88"
          multiline
          maxLength={500}
          value={note}
          onChangeText={(v) => {
            setNote(v);
            setSaved(false);
          }}
          style={[s.input, { minHeight: 88, textAlignVertical: "top" }]}
        />
        <Button
          title={saved ? "✓ Note updated" : "Save note"}
          onPress={() => {
            saveNote(id, note);
            setSaved(true);
          }}
          secondary
        />
      </Card>
    </Page>
  );
}

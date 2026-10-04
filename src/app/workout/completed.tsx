import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import {
    formatTime,
    workout,
} from "../../features/workout/data";
import { useWorkout } from "../../features/workout/store";
import {
    Button,
    Card,
    Page,
    Row,
    c,
    s,
} from "../../features/workout/ui";
export default function WorkoutCompletedScreen() {
  const { data } = useWorkout();
  const params = useLocalSearchParams<{ session?: string }>();
  const session = params.session
    ? data.history.find((v) => v.id === params.session)
    : data.history[0];
  if (!session)
    return (
      <Page title="Session Summary">
        <Card>
          <Text style={s.heading}>No saved session here yet</Text>
          <Text style={s.body}>Finish a workout to see its summary.</Text>
        </Card>
        <Button
          title="View Workout"
          onPress={() => router.replace("/workout/details")}
        />
      </Page>
    );
  return <Summary key={session.id} id={session.id} />;
}
function Summary({ id }: { id: string }) {
  const { data, updateSummary, deleteSummary } = useWorkout();
  const session = data.history.find((v) => v.id === id)!;
  const [note, setNote] = useState(session.note);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const complete =
    session.status === "completed" && session.completedSets === 15;
  return (
    <Page
      title="Session Summary"
      onBack={() => router.replace("/workout/details")}
    >
      <View style={{ alignItems: "center", paddingVertical: 18, gap: 14 }}>
        <View
          style={{
            width: 86,
            height: 86,
            borderRadius: 43,
            borderWidth: 2,
            borderColor: c.teal,
            backgroundColor: c.pale,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: c.teal, fontSize: 40 }}>
            {complete ? "✓" : "◇"}
          </Text>
        </View>
        <Text style={s.title}>
          {complete
            ? "Workout Complete!"
            : session.status === "ended"
              ? "Session Ended"
              : "Session Finished"}
        </Text>
        <Text style={s.body}>
          {complete
            ? "You finished your session successfully."
            : "Your completed activity has been saved."}
        </Text>
      </View>
      <Card>
        <Text style={s.heading}>{workout.name} Summary</Text>
        <Row
          label="Total duration (incl. recovery)"
          value={formatTime(session.elapsedMs / 1000)}
        />
        <Row
          label="Completed sets"
          value={`${session.completedSets} of 15 sets`}
        />
        <Row label="Skipped sets" value={String(session.skippedSets)} />
        <Row
          label="Status"
          value={
            complete
              ? "Completed"
              : session.status === "ended"
                ? "Ended early"
                : "Finished with skips"
          }
        />
        <Row
          label="Date"
          value={new Date(session.startedAt).toLocaleDateString()}
        />
      </Card>
      <Card tinted>
        <Text style={s.smallStrong}>
          Every session is a step forward. Keep building your routine at your
          own pace.
        </Text>
      </Card>
      <Card>
        <Text style={s.heading}>How did it feel?</Text>
        <TextInput
          accessibilityLabel="Session note"
          placeholder="Add a note about this session…"
          placeholderTextColor={c.muted}
          value={note}
          onChangeText={(v) => {
            setNote(v);
            setSaved(false);
          }}
          multiline
          maxLength={500}
          style={[s.input, { minHeight: 80 }]}
        />
        <Button
          title={saved ? "✓ Note updated" : "Save session note"}
          onPress={() => {
            updateSummary(id, note.trim());
            setSaved(true);
          }}
          secondary
        />
      </Card>
      <Button
        title="Back to Workout Details"
        onPress={() => router.replace("/workout/details")}
      />
      <Button
        title="Delete this session record"
        danger
        onPress={() => setConfirm(true)}
      />
      {confirm && (
        <Card>
          <Text style={s.body}>
            Delete this saved summary and its notification? This cannot be
            undone.
          </Text>
          <Button
            title="Delete record"
            danger
            onPress={() => {
              deleteSummary(id);
              router.replace("/workout/details");
            }}
          />
          <Button title="Cancel" secondary onPress={() => setConfirm(false)} />
        </Card>
      )}
    </Page>
  );
}

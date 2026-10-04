import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput } from "react-native";
import { SessionScreen } from "../../features/workout/session-screen";
import { useWorkout } from "../../features/workout/store";
import {
    Button,
    Badge,
    Card,
    Page,
    c,
    s,
} from "../../features/workout/ui";
export default function WorkoutTimerScreen() {
  const { data } = useWorkout();
  return data.session && ["running", "paused"].includes(data.session.status) ? (
    <SessionScreen timer />
  ) : (
    <Settings />
  );
}
function Settings() {
  const { data, saveSettings, resetSettings } = useWorkout();
  const [work, setWork] = useState(String(data.settings.workSeconds));
  const [rest, setRest] = useState(String(data.settings.restSeconds));
  const [message, setMessage] = useState("");
  const save = () => {
    if (
      !/^\d+$/.test(work) ||
      !/^\d+$/.test(rest) ||
      Number(work) < 10 ||
      Number(work) > 120 ||
      Number(rest) < 5 ||
      Number(rest) > 120
    ) {
      setMessage("Enter whole seconds: work 10–120; recovery 5–120.");
      return;
    }
    saveSettings({ workSeconds: Number(work), restSeconds: Number(rest) });
    setMessage("Timer settings saved for your next workout.");
  };
  return (
    <Page title="Workout Timer">
      <Card>
        <Badge>YOUR PACE / YOUR ROUTINE</Badge>
        <Text style={s.title}>Find your rhythm</Text>
        <Text style={s.body}>
          Set movement and recovery time for your next session. The default
          routine lasts 15 minutes, including recovery.
        </Text>
        <Text style={s.smallStrong}>Movement (seconds)</Text>
        <TextInput
          accessibilityLabel="Movement seconds"
          selectionColor={c.accent}
          keyboardType="number-pad"
          value={work}
          onChangeText={(value) => { setWork(value); setMessage(''); }}
          style={s.input}
          maxLength={3}
        />
        <Text style={s.smallStrong}>Recovery (seconds)</Text>
        <TextInput
          accessibilityLabel="Recovery seconds"
          selectionColor={c.accent}
          keyboardType="number-pad"
          value={rest}
          onChangeText={(value) => { setRest(value); setMessage(''); }}
          style={s.input}
          maxLength={3}
        />
        <Button title="Save timer settings" icon="check" onPress={save} />
        <Button
          title="Restore 40s / 20s defaults"
          secondary
          onPress={() => {
            resetSettings();
            setWork("40");
            setRest("20");
            setMessage("Default settings restored.");
          }}
        />
        {!!message && (
          <Text accessibilityLiveRegion="polite" style={s.body}>
            {message}
          </Text>
        )}
      </Card>
      <Button
        title="Return to workout details"
        secondary
        onPress={() => router.replace("/workout/details")}
      />
    </Page>
  );
}

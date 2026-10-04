import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import {
    exercises,
    formatTime,
    workout,
} from "../../features/workout/data";
import {
    currentIndex,
    currentRound,
} from "../../features/workout/engine";
import { useWorkout } from "../../features/workout/store";
import {
    Badge,
    Button,
    Card,
    Figure,
    Page,
    Row,
    c,
    s,
} from "../../features/workout/ui";
export default function PauseResumeScreen() {
  const { data, pause, resume, finish } = useWorkout();
  const [confirm, setConfirm] = useState(false);
  const session = data.session;
  // This route is only reached after pause(); direct links redirect to the running view.
  if (!session) return <Redirect href="/workout/details" />;
  if (session.status === "running") return <Redirect href="/workout/active" />;
  if (["completed", "ended"].includes(session.status))
    return (
      <Redirect
        href={{
          pathname: "/workout/completed",
          params: { session: session.id },
        }}
      />
    );
  return (
    <Page
      title="Workout Paused"
      onBack={() => {
        pause();
        router.replace("/workout/details");
      }}
    >
      <View style={{ opacity: 0.45, paddingVertical: 15 }}>
        <Figure id={exercises[currentIndex(session)].id} />
      </View>
      <Card>
        <Badge>WORKOUT PAUSED</Badge>
        <Text style={s.title}>{workout.name}</Text>
        <Row
          label="Current movement"
          value={exercises[currentIndex(session)].name}
        />
        <Row
          label="Remaining interval"
          value={formatTime(Math.ceil(session.remainingMs / 1000))}
        />
        <Row
          label="Session round"
          value={`Round ${currentRound(session)} of 3`}
        />
        <Row
          label="Phase"
          value={session.phase % 2 ? "Recovery" : "Movement"}
        />
        <View
          style={{
            padding: 14,
            borderRadius: 10,
            backgroundColor: c.pink,
            gap: 6,
          }}
        >
          <Text style={[s.smallStrong, { color: c.red }]}>
            Ending your session early?
          </Text>
          <Text style={s.body}>
            Your completed sets and elapsed time will be saved. The session will
            be marked as ended early.
          </Text>
        </View>
        <Button
          title="▷ Resume Workout"
          onPress={() => {
            resume();
            router.replace("/workout/active");
          }}
        />
        <Button
          title="End Workout Early"
          danger
          onPress={() => setConfirm(true)}
        />
        {confirm && (
          <Card>
            <Text style={s.heading}>End this session?</Text>
            <Button title="Yes, end and save session" danger onPress={finish} />
            <Button
              title="Keep it paused"
              secondary
              onPress={() => setConfirm(false)}
            />
          </Card>
        )}
      </Card>
    </Page>
  );
}

import { Redirect, router } from "expo-router";
import { Text, View } from "react-native";
import { formatTime } from "./data";
import { currentIndex, currentRound, totalSets } from "./engine";
import { useWorkout } from "./store";
import { Badge, Button, Card, Clock, Figure, Page, c, s } from "./ui";
export function SessionScreen({ timer = false }: { timer?: boolean }) {
  const { data, pause, skip, busy, pending, error } = useWorkout();
  const session = data.session;
  if (!session) return <Redirect href="/workout/sessions" />;
  if (["completed", "ended-early"].includes(session.status) && (busy || pending || error)) return <Page title="Finishing workout"><Text style={s.body}>Your summary will open after the API confirms the final update.</Text></Page>;
  if (["completed", "ended-early"].includes(session.status))
    return (
      <Redirect
        href={{
          pathname: "/workout/completed",
          params: { session: session.id },
        }}
      />
    );
  if (session.status === "paused") return <Redirect href="/workout/pause" />;
  const index = currentIndex(session);
  const exercises = session.snapshot.exercises;
  const total = totalSets(session);
  const exercise = exercises[index];
  const rest = session.phase % 2 === 1;
  const remaining = session.remainingMs / 1000;
  const pauseScreen = () => {
    pause();
    router.replace("/workout/pause");
  };
  return (
    <Page
      title={timer ? "Workout Timer" : "Active Workout"}
      onBack={pauseScreen}
    >
      <View style={s.row}>
        <Badge>ROUND {currentRound(session)} OF {session.snapshot.rounds}</Badge>
        <Text style={s.label}>MVT {index + 1} OF {exercises.length}</Text>
        <Text style={s.smallStrong}>
          {formatTime(session.elapsedMs / 1000)}
        </Text>
      </View>
      <View
        accessible
        accessibilityLabel={`${session.completedSets} of ${total} sets complete`}
        style={{
          height: 5,
          borderRadius: 3,
          backgroundColor: c.border,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 5,
            width: `${(session.completedSets / total) * 100}%`,
            backgroundColor: c.accent,
          }}
        />
      </View>
      {timer ? (
        <>
          <View style={s.row}>
            <Badge>
              {rest ? "RECOVERY" : "MOVEMENT"} (
              {rest ? session.restSeconds : session.workSeconds}s)
            </Badge>
          </View>
          <Card>
            <Text style={[s.heading, { textAlign: "center" }]}>
              {exercise.name}
            </Text>
          </Card>
          <Clock
            remaining={remaining}
            total={rest ? session.restSeconds : session.workSeconds}
          />
        </>
      ) : (
        <>
          <Card>
            <Figure id={exercise.id} />
            <Text style={s.title}>
              {rest ? "Take a breath" : exercise.name}
            </Text>
            <Text style={s.body}>
              {rest
                ? "Relax and get ready for the next movement."
                : exercise.cue}
            </Text>
          </Card>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Button
                title="Read Steps"
                secondary
                onPress={() => {
                  pause();
                  router.push({
                    pathname: "/workout/instructions",
                    params: { exercise: exercise.id, sessionId: session.id },
                  });
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Watch Video"
                secondary
                onPress={() => {
                  pause();
                  router.push({
                    pathname: "/workout/video",
                    params: { exercise: exercise.id, sessionId: session.id },
                  });
                }}
              />
            </View>
          </View>
          <Card tinted>
            <Text style={[s.label, { textAlign: "center", color: c.accent }]}>
              {rest ? "RECOVERY REMAINING" : "FOCUS REMAINING"}
            </Text>
            <Text style={[s.digits, { textAlign: "center" }]}>
              {formatTime(Math.ceil(remaining))}
            </Text>
          </Card>
        </>
      )}
      <Card>
        <Text style={s.label}>UP NEXT</Text>
        <Text style={s.heading}>
          {session.phase >= (total - 1) * 2
            ? "Finish your session"
            : exercises[(index + 1) % exercises.length].name}
        </Text>
        <Text style={s.body}>
          {session.completedSets} completed · {session.skippedSets} skipped
        </Text>
      </Card>
      <Button title="Ⅱ Pause" onPress={pauseScreen} secondary />
      <Button
        title={timer ? "Guided View" : "Open Workout Timer"}
        onPress={() =>
          router.replace(timer ? "/workout/active" : "/workout/timer")
        }
        secondary
      />
      <Button title="Skip to Next Movement →" disabled={busy || pending} onPress={() => { void skip(); }} />
      <Button title="End Workout Early" danger onPress={pauseScreen} />
    </Page>
  );
}

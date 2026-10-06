import { Alert, Platform } from "react-native";
import type { Href } from "expo-router";
import { router } from "expo-router";

// TODO: Members 2/3/4 should supply their real routes here during integration.
export const integrationRoutes: {
  workoutOverview?: Extract<Href, { pathname: unknown }>;
  activeWorkout?: Href;
  progress?: Href;
  login?: Href;
} = {
  workoutOverview: { pathname: "/member2/workout-overview" },
};
export function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
export function startWorkout(id: string) {
  if (integrationRoutes.activeWorkout) {
    const route = integrationRoutes.activeWorkout;
    router.push(
      (typeof route === "string"
        ? { pathname: route, params: { id } }
        : { ...route, params: { ...route.params, id } }) as Href,
    );
  } else
    notify(
      "Start Workout",
      "Active workout module will be connected during integration.",
    );
}
export function openProgress() {
  if (integrationRoutes.progress) router.navigate(integrationRoutes.progress);
  else
    notify("Progress", "Progress module will be connected during integration.");
}
export function confirmLogout(onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm("Log out of FitTrack?")) onConfirm();
  } else
    Alert.alert("Log out", "Log out of FitTrack?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", onPress: onConfirm },
    ]);
}

// TODO: Set the team's workout detail route during integration.
export function openWorkoutOverview(id: string) {
  const route = integrationRoutes.workoutOverview;
  if (route) {
    router.push({ ...route, params: { ...route.params, id } });
  } else {
    notify("Workout details", "The team's workout detail screen will be connected during integration.");
  }
}

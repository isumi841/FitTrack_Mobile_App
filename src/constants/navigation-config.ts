import type { Href } from "expo-router";

export const WORKOUTS_TAB = {
  href: "/member2/workout-categories",
  matchPaths: [
    "/member2/workout",
    "/member2/workout-categories",
    "/member2/workout-filter",
    "/member2/filtered-results",
    "/member2/workout-library",
    "/member2/workout-overview",
    "/workout-categories",
    "/workout-filter",
    "/filtered-results",
    "/workout-library",
    "/workout-overview",
  ],
} satisfies { href: Href; matchPaths: readonly Href[] };

export function isWorkoutRoute(pathname: string) {
  return WORKOUTS_TAB.matchPaths.some(
    (matchPath) =>
      typeof matchPath === "string" &&
      (pathname === matchPath || pathname.startsWith(`${matchPath}/`)),
  );
}

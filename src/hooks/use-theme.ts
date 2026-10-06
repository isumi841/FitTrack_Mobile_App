/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { usePathname } from "expo-router";
import { Colors, HomeColors } from "@/constants/theme";
import { isWorkoutRoute } from "@/constants/navigation-config";
import { useMember } from "@/providers/member-state";

export function useTheme() {
  const pathname = usePathname();
  const { dark } = useMember();
  if (pathname === "/" || isWorkoutRoute(pathname)) return HomeColors;
  return Colors[dark ? "dark" : "light"];
}

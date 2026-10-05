import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0a1212",
    background: "#f0f7f6",
    backgroundElement: "#e6f3f1",
    backgroundSelected: "rgba(82,196,168,0.15)",
    textSecondary: "#3d5c57",
    accent: "#3a9e88",
    border: "rgba(82,196,168,0.18)",
    workoutBackground: "#f0f7f6",
    workoutSecondaryBackground: "#e6f3f1",
    workoutSurface: "rgba(255,255,255,0.85)",
    workoutBorder: "rgba(82,196,168,0.18)",
    workoutActiveBorder: "rgba(82,196,168,0.55)",
    workoutAccent: "#3a9e88",
    workoutOnAccent: "#0a1212",
    workoutDim: "rgba(82,196,168,0.15)",
    workoutGlow: "rgba(82,196,168,0.25)",
    workoutText: "#0a1212",
    workoutMuted: "#3d5c57",
    workoutSubtle: "#679288",
    workoutCard: "rgba(255,255,255,0.9)",
    workoutCardBorder: "rgba(82,196,168,0.2)",
  },
  dark: {
    text: "#e8f0ef",
    background: "#080e0e",
    backgroundElement: "#0a1212",
    backgroundSelected: "rgba(82,196,168,0.18)",
    textSecondary: "rgba(232,240,239,0.55)",
    accent: "#52c4a8",
    border: "rgba(255,255,255,0.07)",
    workoutBackground: "#080e0e",
    workoutSecondaryBackground: "#0a1212",
    workoutSurface: "rgba(255,255,255,0.04)",
    workoutBorder: "rgba(255,255,255,0.07)",
    workoutActiveBorder: "rgba(82,196,168,0.45)",
    workoutAccent: "#52c4a8",
    workoutOnAccent: "#080e0e",
    workoutDim: "rgba(82,196,168,0.18)",
    workoutGlow: "rgba(82,196,168,0.35)",
    workoutText: "#e8f0ef",
    workoutMuted: "rgba(232,240,239,0.55)",
    workoutSubtle: "rgba(232,240,239,0.32)",
    workoutCard: "rgba(255,255,255,0.05)",
    workoutCardBorder: "rgba(255,255,255,0.09)",
  },
} as const;

export const HomeColors = {
  ...Colors.dark,
  accent: "#BFFF2E",
  backgroundSelected: "rgba(191,255,46,0.12)",
  workoutBackground: "#090D0F",
  workoutSecondaryBackground: "#0D1214",
  workoutSurface: "#151A1F",
  workoutBorder: "#293129",
  workoutActiveBorder: "#BFFF2E",
  workoutAccent: "#BFFF2E",
  workoutOnAccent: "#0A0D08",
  workoutDim: "rgba(191,255,46,0.11)",
  workoutGlow: "rgba(191,255,46,0.25)",
  workoutCard: "#151A1F",
  workoutCardBorder: "#293129",
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const WorkoutFonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: WorkoutFonts.regular,
    serif: WorkoutFonts.regular,
    rounded: WorkoutFonts.semibold,
    mono: "ui-monospace",
  },
  default: {
    sans: WorkoutFonts.regular,
    serif: WorkoutFonts.regular,
    rounded: WorkoutFonts.semibold,
    mono: "monospace",
  },
  web: {
    sans: WorkoutFonts.regular,
    serif: WorkoutFonts.regular,
    rounded: WorkoutFonts.semibold,
    mono: "monospace",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;

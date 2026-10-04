import { FITTRACK_COLORS } from "@/constants/fittrack-theme";

export const NAV_COLORS = {
  ...FITTRACK_COLORS,
  // The recording uses a slightly lighter lime and olive surfaces for the dock.
  surface: "#151815",
  surfaceRaised: "#232719",
  accent: "#CDF953",
  accentSoft: "rgba(205, 249, 83, 0.09)",
  accentBorder: "rgba(205, 249, 83, 0.25)",
  accentGlow: "rgba(205, 249, 83, 0.3)",
  border: "#252A28",
  text: "#E6EBF2",
  muted: "#989D93",
  ink: "#1F2612",
} as const;

export const NAV_SPRING = { damping: 18, stiffness: 240, mass: 0.7 };

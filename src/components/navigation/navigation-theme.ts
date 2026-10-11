import { FITTRACK_COLORS } from '@/constants/fittrack-theme';

export const NAV_COLORS = {
  ...FITTRACK_COLORS,
  // The reference uses a deeper charcoal base with olive-lime highlights for the dock.
  surface: '#151815',
  surfaceRaised: '#232719',
  surfaceStrong: '#2B312A',
  accent: '#CDF953',
  accentSoft: 'rgba(205, 249, 83, 0.09)',
  accentBorder: 'rgba(205, 249, 83, 0.25)',
  accentGlow: 'rgba(205, 249, 83, 0.3)',
  border: '#252A28',
  text: '#E6EBF2',
  muted: '#989D93',
  ink: '#1F2612',
  shadow: 'rgba(0, 0, 0, 0.25)',
} as const;

export const NAV_THEME = {
  dock: NAV_COLORS.surface,
  dockRaised: NAV_COLORS.surfaceRaised,
  dockStrong: NAV_COLORS.surfaceStrong,
  active: NAV_COLORS.accent,
  activeSoft: NAV_COLORS.accentSoft,
  activeBorder: NAV_COLORS.accentBorder,
  activeGlow: NAV_COLORS.accentGlow,
  neutral: NAV_COLORS.muted,
  text: NAV_COLORS.text,
  overlay: NAV_COLORS.shadow,
} as const;

export const NAV_SPRING = { damping: 18, stiffness: 240, mass: 0.7 } as const;

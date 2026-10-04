import { FITTRACK_COLORS } from '@/constants/fittrack-theme';

export const NAV_COLORS = {
  ...FITTRACK_COLORS,
  surface: '#161916',
  surfaceRaised: '#20251D',
  border: 'rgba(224, 241, 196, 0.16)',
} as const;

export const NAV_SPRING = { damping: 18, stiffness: 240, mass: 0.7 };

import { Platform, type TextStyle } from 'react-native';
import { FITTRACK_COLORS as C } from '@/constants/fittrack-theme';

// Keep the imported selection screens consistent with this branch's workout UI.
const font = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' });
export const WorkoutFonts = { regular: font, medium: font, semibold: font, bold: font };
export const WorkoutFontWeights: Record<keyof typeof WorkoutFonts, TextStyle['fontWeight']> = {
  regular: '400', medium: '500', semibold: '600', bold: '700',
};
const theme = {
  workoutBackground: C.bg, workoutSurface: C.surface, workoutBorder: C.border,
  workoutActiveBorder: C.accentBorder, workoutAccent: C.accent, workoutOnAccent: C.ink,
  workoutDim: C.accentSoft, workoutText: C.text, workoutMuted: C.muted,
  workoutSubtle: C.muted, workoutCard: C.surface, workoutCardBorder: C.border,
};
export function useDiscoveryTheme() { return theme; }

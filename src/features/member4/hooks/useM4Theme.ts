/**
 * Member 4 – hook to resolve the correct color scheme object.
 * Respects the system dark/light mode preference.
 */
import { useColorScheme } from 'react-native';
import { M4Colors } from '../constants/colors';

export type M4ThemeColors = typeof M4Colors.dark | typeof M4Colors.light;

export function useM4Theme(): M4ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? M4Colors.dark : M4Colors.light;
}

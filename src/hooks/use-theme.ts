/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, useTheme as useAppTheme } from '@/constants/theme';

export function useTheme() {
  const { colorScheme } = useAppTheme();

  return Colors[colorScheme];
}

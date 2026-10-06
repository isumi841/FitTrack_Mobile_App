import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, WorkoutFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? (type === 'linkPrimary' ? 'accent' : 'text')] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: WorkoutFonts.medium,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: WorkoutFonts.bold,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: WorkoutFonts.regular,
  },
  title: {
    fontSize: 48,
    lineHeight: 52,
    fontFamily: WorkoutFonts.semibold,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontFamily: WorkoutFonts.semibold,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: WorkoutFonts.regular,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: WorkoutFonts.medium,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});

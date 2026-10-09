import React from 'react';
import { View, StyleSheet, Platform, ViewProps } from 'react-native';
import { usePathname } from 'expo-router';
import { useTheme } from '@/features/member1/constants/theme';
import { PhonePreviewFrame } from './PhonePreviewFrame';

interface MobileScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  backgroundColor?: string;
  previewForegroundColor?: string;
}

export function MobileScreenContainer({ children, style, backgroundColor, previewForegroundColor, ...props }: MobileScreenContainerProps) {
  const t = useTheme();
  const member1Screen = usePathname().startsWith('/member1_onboarding_personalization');

  const screen = (
    <View style={[styles.root, { backgroundColor: backgroundColor ?? t.bg }]} {...props}>
      <View style={[styles.container, member1Screen && styles.appContent, style]}>
        {children}
      </View>
    </View>
  );

  // The shared app shell owns Member 1 sizing, just as it does for Member 4.
  if (member1Screen) return screen;

  return (
    <PhonePreviewFrame
      backgroundColor={backgroundColor ?? t.bg}
      foregroundColor={previewForegroundColor ?? (backgroundColor === undefined && t.isDark ? '#F5F8F4' : '#222222')}>
      {screen}
    </PhonePreviewFrame>
  );
}

const styles = StyleSheet.create({
  appContent: { maxWidth: undefined, minHeight: 0 },
  root: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    // Fill the available app viewport.
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    // Preserve the separate admin preview sizing.
    maxWidth: Platform.OS === 'web' ? 420 : '100%',
    backgroundColor: 'transparent', // Let root bg show through
  },
});

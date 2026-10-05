import React from 'react';
import { View, StyleSheet, Platform, ViewProps } from 'react-native';
import { useTheme } from '@/constants/theme';
import { PhonePreviewFrame } from './PhonePreviewFrame';

interface MobileScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  backgroundColor?: string;
  previewForegroundColor?: string;
}

export function MobileScreenContainer({ children, style, backgroundColor, previewForegroundColor, ...props }: MobileScreenContainerProps) {
  const t = useTheme();

  const screen = (
    <View style={[styles.root, { backgroundColor: backgroundColor ?? t.bg }]} {...props}>
      <View style={[styles.container, style]}>
        {children}
      </View>
    </View>
  );

  return (
    <PhonePreviewFrame
      backgroundColor={backgroundColor ?? t.bg}
      foregroundColor={previewForegroundColor ?? (backgroundColor === undefined && t.isDark ? '#F5F8F4' : '#222222')}>
      {screen}
    </PhonePreviewFrame>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Ensure the background extends to full screen width on web
    alignItems: 'center', 
  },
  container: {
    flex: 1,
    width: '100%',
    // Constrain width on Web to smartphone size
    maxWidth: Platform.OS === 'web' ? 420 : '100%',
    backgroundColor: 'transparent', // Let root bg show through
  },
});

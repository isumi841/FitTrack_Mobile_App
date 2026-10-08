import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/features/member1/theme';

interface MobileScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  backgroundColor?: string;
  previewForegroundColor?: string;
}

export function MobileScreenContainer({ children, style, backgroundColor, previewForegroundColor: _previewForegroundColor, ...props }: MobileScreenContainerProps) {
  const t = useTheme();

  const screen = (
    <View style={[styles.root, { backgroundColor: backgroundColor ?? t.bg }]} {...props}>
      <View style={[styles.container, style]}>
        {children}
      </View>
    </View>
  );

  return screen;
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
    minHeight: 0,
    backgroundColor: 'transparent', // Let root bg show through
  },
});

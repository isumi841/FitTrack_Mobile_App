/**
 * M4Screen – wrapper that provides the M4 background and top safe area.
 * The app layout owns the shared bottom navigation and its spacing.
 * Wrap every Member 4 screen in this instead of bare SafeAreaView.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useM4Theme } from '../hooks/useM4Theme';

interface M4ScreenProps {
  children: React.ReactNode;
  /** @deprecated Navigation is now managed by the root app layout. */
  showNav?: boolean;
}

export function M4Screen({ children }: M4ScreenProps) {
  const c = useM4Theme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.bg }]}
      edges={['top']}
    >
      <View style={styles.inner}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  inner: {
    flex: 1,
  },
});

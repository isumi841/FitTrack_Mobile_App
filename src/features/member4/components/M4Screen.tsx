/**
 * M4Screen – wrapper that provides the M4 background and top safe area.
 * The app layout owns the shared bottom navigation and its spacing.
 * Wrap every Member 4 screen in this instead of bare SafeAreaView.
 */
import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useMember4Activity } from '../context/Member4Activity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useM4Theme } from '../hooks/useM4Theme';

interface M4ScreenProps {
  children: React.ReactNode;
  /** @deprecated Navigation is now managed by the root app layout. */
  showNav?: boolean;
}

export function M4Screen({ children }: M4ScreenProps) {
  const c = useM4Theme();
  const { refresh, loading, error } = useMember4Activity();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.bg }]}
      edges={['top']}
    >
      <View style={styles.inner}>
        {!!error && <View style={{ padding: 12, gap: 8 }}><Text accessibilityRole="alert" style={{ color: c.text }}>{error}</Text><Pressable accessibilityRole="button" disabled={loading} onPress={() => { void refresh(); }}><Text style={{ color: c.teal }}>Retry loading progress</Text></Pressable></View>}
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

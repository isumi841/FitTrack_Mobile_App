import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/features/member1/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingNextScreen() {
  const t = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]}>
      <View style={styles.container}>
        <Ionicons name="construct-outline" size={64} color={t.tealDark} style={styles.icon} />
        <Text style={[styles.title, { color: t.textHeading }]}>Almost there!</Text>
        <Text style={[styles.subtitle, { color: t.muted }]}>
          Next onboarding step coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

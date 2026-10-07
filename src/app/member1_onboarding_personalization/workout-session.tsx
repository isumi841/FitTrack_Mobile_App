import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { useTheme } from '@/constants/theme';

export default function WorkoutSessionScreen() {
  const t = useTheme();
  const accent = t.isDark ? t.primaryLime : t.primaryGreen;

  return (
    <MobileScreenContainer>
      <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Back to personalized plan">
          <Ionicons name="chevron-back" size={24} color={t.textPrimary} />
        </Pressable>
        <View style={styles.content}>
          <View style={[styles.icon, { backgroundColor: t.limeDim }]}><Ionicons name="barbell-outline" size={32} color={accent} /></View>
          <Text style={[styles.title, { color: t.textPrimary }]}>Your workout is ready</Text>
          <Text style={[styles.copy, { color: t.textSecondary }]}>Full workout playback will appear here as the workout module is connected.</Text>
          <Pressable onPress={() => router.back()} style={[styles.button, { backgroundColor: accent }]}><Text style={[styles.buttonText, { color: t.isDark ? '#080D0B' : '#FFFFFF' }]}>BACK TO PLAN</Text></Pressable>
        </View>
      </SafeAreaView>
    </MobileScreenContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, back: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }, content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }, icon: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, title: { fontSize: 24, fontWeight: '800', textAlign: 'center' }, copy: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, marginBottom: 26 }, button: { height: 48, borderRadius: 14, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }, buttonText: { fontSize: 13, fontWeight: '800' },
});

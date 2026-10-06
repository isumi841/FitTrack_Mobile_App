import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPrimaryButton } from '@/components/member1/AuthPrimaryButton';
import { AUTH_COLORS } from '@/components/member1/auth-theme';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';

// Temporary destination while the backend has no JWT/session or protected app area.
export default function LoginSuccessScreen() {
  const focused = useIsFocused();
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Login successful', contentStyle: { backgroundColor: AUTH_COLORS.background } }} />
      {focused && <StatusBar style="light" />}
      <MobileScreenContainer backgroundColor={AUTH_COLORS.background} previewForegroundColor={AUTH_COLORS.text}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.icon}>
            <Ionicons name="checkmark-circle-outline" size={36} color={AUTH_COLORS.primary} accessible={false} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>Login successful</Text>
          <Text style={styles.description}>Welcome back to FitTrack.</Text>
          <AuthPrimaryButton title="Back to Log In" onPress={() => router.replace('/member1_onboarding_personalization/login')} />
        </ScrollView>
      </MobileScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AUTH_COLORS.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  icon: { alignSelf: 'center', padding: 20, borderRadius: 40, backgroundColor: AUTH_COLORS.surface, marginBottom: 24 },
  title: { color: AUTH_COLORS.text, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  description: { color: AUTH_COLORS.secondary, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
});

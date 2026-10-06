import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, Text, View } from 'react-native';

import { AuthPrimaryButton } from '@/components/member1/AuthPrimaryButton';
import { AUTH_COLORS } from '@/components/member1/auth-theme';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';

// AuthSession validates state and exchanges the one-time code in the opener.
// The callback route never authenticates from URL identity data.
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  return (
    <MobileScreenContainer backgroundColor={AUTH_COLORS.background} previewForegroundColor={AUTH_COLORS.text}>
      <View style={styles.content}>
        <Text style={styles.title}>Completing sign-in...</Text>
        <Text style={styles.description}>Return to the FitTrack window where you started sign-in.</Text>
        <AuthPrimaryButton title="Back to Log In" onPress={() => router.replace('/member1_onboarding_personalization/login')} />
      </View>
    </MobileScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: AUTH_COLORS.text, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  description: { color: AUTH_COLORS.secondary, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
});

import { Ionicons } from '@expo/vector-icons';
import { Image as FadeImage } from 'expo-image';
import { Stack, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MobileScreenContainer } from './MobileScreenContainer';
import { SocialAuthButton, type SocialProvider } from './SocialAuthButton';
import { AUTH_COLORS } from './auth-theme';

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  children: ReactNode;
};

export function AuthScreenLayout({ title, subtitle, image, children }: AuthScreenLayoutProps) {
  const focused = useIsFocused();
  const [heroHeight, setHeroHeight] = useState(256);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title, contentStyle: { backgroundColor: AUTH_COLORS.background } }} />
      {/* Restore the previous screen's status bar when this stack screen loses focus. */}
      {focused && <StatusBar style="light" />}
      <MobileScreenContainer
        backgroundColor={AUTH_COLORS.background}
        previewForegroundColor={AUTH_COLORS.text}>
        <View
          style={styles.flex}
          onLayout={({ nativeEvent: { layout } }) => {
            // Measure the app viewport, so artwork scales with the available screen height.
            if (layout.height > 0) setHeroHeight(Math.round(layout.height * 0.32));
          }}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}>
              <View style={[styles.hero, { height: heroHeight }]}>
                <Image source={image} style={styles.heroImage} resizeMode="cover" accessible={false} />
                <FadeImage
                  source={require('@/assets/images/member1/auth-hero-fade.svg')}
                  contentFit="fill"
                  style={styles.heroFade}
                  accessible={false}
                />
                <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              </View>
              <View style={styles.formContent}>
                <Text style={styles.subtitle}>{subtitle}</Text>
                {children}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </MobileScreenContainer>
    </SafeAreaView>
  );
}

export function AuthSocialOptions({
  signup = false,
  onSelect,
  disabled = false,
}: {
  signup?: boolean;
  onSelect: (provider: SocialProvider) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.socialSection}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{signup ? 'SIGN UP WITH' : 'LOG IN WITH'}</Text>
        <View style={styles.dividerLine} />
      </View>
      <View style={styles.socialRow}>
        <SocialAuthButton provider="Google" disabled={disabled} onPress={() => onSelect('Google')} />
        <SocialAuthButton provider="Apple" disabled={disabled} onPress={() => onSelect('Apple')} />
      </View>
    </View>
  );
}

export function AuthFeedback({ message }: { message: string }) {
  if (!message) return null;

  return (
    <View style={styles.feedback}>
      <Ionicons name="information-circle-outline" size={18} color={AUTH_COLORS.primary} accessible={false} />
      <Text accessibilityLiveRegion="polite" style={styles.feedbackText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AUTH_COLORS.background },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  hero: {
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: AUTH_COLORS.background,
  },
  heroImage: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '125%',
    // A taller cover-cropped image keeps the athlete's head in the visible crop.
  },
  heroFade: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
  title: {
    position: 'absolute', bottom: 20, left: 22, right: 22,
    color: AUTH_COLORS.text, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8,
  },
  formContent: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 24, paddingTop: 4 },
  subtitle: { color: AUTH_COLORS.secondary, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  socialSection: { marginTop: 26 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: AUTH_COLORS.border },
  dividerText: { color: AUTH_COLORS.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1.3 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  feedback: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16,
    padding: 12, borderRadius: 12, backgroundColor: AUTH_COLORS.surface,
    borderWidth: 1, borderColor: AUTH_COLORS.border,
  },
  feedbackText: { flex: 1, color: AUTH_COLORS.secondary, fontSize: 12, lineHeight: 18 },
});

import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { PrimaryButton } from '@/components/member1/PrimaryButton';
import { ThemeToggle } from '@/components/member1/ThemeToggle';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WELCOME_IMAGE = require('../../../assets/images/welcome.png');

export default function WelcomeScreen() {
  const t = useTheme();
  const { height } = useWindowDimensions();

  const heroHeight = Math.min(Math.max(Math.round(height * 0.20), 200), 220);

  const [heroAnim] = React.useState(() => new Animated.Value(0));
  const [contentAnim] = React.useState(() => new Animated.Value(0));
  const [contentTranslate] = React.useState(() => new Animated.Value(18));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [contentAnim, contentTranslate, heroAnim]);

  const handleGetStarted = () => {
    router.push('/member1_onboarding_personalization/beginner-onboarding');
  };

  const handleLogin = () => {
    router.push('/member1_onboarding_personalization/login');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top', 'bottom']}>
      <MobileScreenContainer>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <View style={[styles.brandPill, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
              <Ionicons name="fitness" size={15} color={t.isDark ? t.primaryLime : t.primaryGreen} />
              <Text style={[styles.brandText, { color: t.textPrimary }]}>FitTrack</Text>
            </View>
            <ThemeToggle />
          </View>

          <Animated.View style={[styles.hero, { height: heroHeight, opacity: heroAnim }]}>
            <Image source={WELCOME_IMAGE} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroScrim} pointerEvents="none" />
            <View style={styles.heroCaption} pointerEvents="none">
              <View style={styles.heroAccent} />
              <Text style={styles.heroCaptionText}>MOVE WITH PURPOSE</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.contentCard,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
                opacity: contentAnim,
                transform: [{ translateY: contentTranslate }],
              },
            ]}>
            <Text style={[styles.heading, { color: t.textPrimary }]}>Start Your Fitness Journey</Text>
            <Text style={[styles.subheading, { color: t.textSecondary }]}>Train smarter. Build consistency. Become stronger.</Text>

            <View style={styles.benefitsRow}>
              <View style={[styles.benefitChip, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
                <Ionicons name="person-outline" size={13} color={t.isDark ? t.primaryLime : t.primaryGreen} />
                <Text style={[styles.benefitText, { color: t.textSecondary }]}>Personalized</Text>
              </View>
              <View style={[styles.benefitChip, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
                <Ionicons name="trending-up-outline" size={13} color={t.secondaryTeal} />
                <Text style={[styles.benefitText, { color: t.textSecondary }]}>Progress</Text>
              </View>
              <View style={[styles.benefitChip, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
                <Ionicons name="repeat-outline" size={13} color={t.isDark ? t.primaryLime : t.primaryGreen} />
                <Text style={[styles.benefitText, { color: t.textSecondary }]}>Consistency</Text>
              </View>
            </View>
          </Animated.View>

          {/** Keep the existing screen flow and actions below unchanged. */}
          <View style={styles.spacer} />

          <View style={styles.footer}>
            <PrimaryButton title="Get Start" onPress={handleGetStarted} />
            <View style={styles.loginRow}>
              <Text style={[styles.loginMuted, { color: t.textSecondary }]}>Already have an account? </Text>
              <Pressable onPress={handleLogin} hitSlop={10}>
                <Text style={[styles.loginLink, { color: t.isDark ? t.primaryLime : t.primaryGreen }]}>Log in</Text>
              </Pressable>
            </View>
          </View>

        </View>
      </MobileScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: 26,
    backgroundColor: '#101510',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 8, 5, 0.18)',
  },
  heroCaption: {
    position: 'absolute',
    left: 10,
    bottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroAccent: { width: 22, height: 3, borderRadius: 2, backgroundColor: '#B8F52A' },
  heroCaptionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  contentCard: {
    marginTop: -0.1,
    marginHorizontal: 12,
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 11,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  brandSub: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  headingWrapper: {
    alignItems: 'center',
    marginTop: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 10,
  },
  benefitsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  benefitChip: {
    flex: 1,
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 5,
    borderRadius: 11,
    borderWidth: 1,
  },
  benefitText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  spacer: { flex: 1, minHeight: 5 },
  footer: { width: '100%' },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginMuted: { fontSize: 13, fontWeight: '500' },
  loginLink: { fontSize: 13, fontWeight: '700' },
});

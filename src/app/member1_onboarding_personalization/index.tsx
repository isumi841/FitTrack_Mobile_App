import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { PrimaryButton } from '@/components/member1/PrimaryButton';
import { ThemeToggle } from '@/components/member1/ThemeToggle';
import { useTheme } from '@/features/member1/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WELCOME_IMAGE = require('../../../assets/images/welcome.png');

export default function WelcomeScreen() {
  const t = useTheme();


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
    <ImageBackground 
      source={WELCOME_IMAGE} 
      style={styles.backgroundImage} 
      resizeMode="cover"
    >
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', t.background]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <MobileScreenContainer>
          <View style={styles.container}>
            <View style={styles.topBar}>
              <View style={[styles.brandPill, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
                <Ionicons name="fitness" size={15} color={t.isDark ? t.primaryLime : t.primaryGreen} />
                <Text style={[styles.brandText, { color: t.textPrimary }]}>FitTrack</Text>
              </View>
              <ThemeToggle />
            </View>

            <Animated.View style={[styles.heroCaptionContainer, { opacity: heroAnim }]} pointerEvents="none">
              <View style={styles.heroAccent} />
              <Text style={styles.heroCaptionText}>MOVE WITH PURPOSE</Text>
            </Animated.View>

            <View style={styles.spacer} />

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

            <View style={styles.footerSpacer} />

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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  brandText: { fontSize: 14, fontWeight: '700' },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
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
  heroCaptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginLeft: 10,
  },
  heroAccent: { width: 22, height: 3, borderRadius: 2, backgroundColor: '#B8F52A' },
  heroCaptionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  spacer: { flex: 1 },
  contentCard: {
    marginHorizontal: 12,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 18,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
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
    marginBottom: 15,
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
  footerSpacer: { minHeight: 20 },
  footer: { width: '100%', paddingHorizontal: 12 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  loginMuted: { fontSize: 13, fontWeight: '500' },
  loginLink: { fontSize: 13, fontWeight: '700' },
});

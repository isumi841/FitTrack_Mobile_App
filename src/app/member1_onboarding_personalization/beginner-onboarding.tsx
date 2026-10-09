import React, { useEffect } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/features/member1/constants/theme';
import { MobileScreenContainer } from '@/features/member1/components/MobileScreenContainer';
import { PrimaryButton } from '@/features/member1/components/PrimaryButton';
import { ThemeToggle } from '@/features/member1/components/ThemeToggle';

const AUTO_SLIDE_INTERVAL = 5000;
const FITNESS_JOURNEY_IMAGES = [
  require('@/assets/images/member1/fitnessjouney1 (1).png'),
  require('@/assets/images/member1/fitnessjouney1 (2).png'),
  require('@/assets/images/member1/fitnessjouney1 (3).png'),
];

export default function BeginnerOnboardingScreen() {
  const t = useTheme();
  const { height } = useWindowDimensions();

  // Keep the artwork prominent without allowing a portrait source image to
  // consume the entire screen or leave large empty areas around it.
  const heroHeight = Math.min(Math.max(Math.round(height * 0.48), 330), 440);

  // Entrance animations
  const [imageAnim] = React.useState(() => new Animated.Value(0));
  const [contentAnim] = React.useState(() => new Animated.Value(0));
  const [contentTranslate] = React.useState(() => new Animated.Value(20));
  const [footerAnim] = React.useState(() => new Animated.Value(0));
  const [footerTranslate] = React.useState(() => new Animated.Value(15));
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [slideOpacity] = React.useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(imageAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(footerAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(footerTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [imageAnim, contentAnim, contentTranslate, footerAnim, footerTranslate]);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(slideOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        setActiveSlide((current) => (current + 1) % FITNESS_JOURNEY_IMAGES.length);
        Animated.timing(slideOpacity, { toValue: 1, duration: 360, useNativeDriver: true }).start();
      });
    }, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [slideOpacity]);

  const handleNext = () => {
    router.push('/member1_onboarding_personalization/fitness-level');
  };

  // Gradient overlay styling for Web and Native
  const rgbBase = t.isDark ? '8, 13, 11' : '245, 248, 244';
  const webGradient = Platform.OS === 'web'
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(${rgbBase}, 0) 0%, rgba(${rgbBase}, 0.25) 50%, rgba(${rgbBase}, 0.75) 80%, rgba(${rgbBase}, 1) 100%)`,
      }
    : undefined;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top', 'bottom']}>
      <MobileScreenContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}>

          {/* ========================================================= */}
          {/* 1. TOP IMAGE SECTION (48-52% screen height, cover, rounded) */}
          {/* ========================================================= */}
          <Animated.View
            style={[
              styles.heroContainer,
              {
                height: heroHeight,
                opacity: imageAnim,
              },
            ]}>
            <Animated.View style={[styles.heroImage, { opacity: slideOpacity }]}>
              <Image source={FITNESS_JOURNEY_IMAGES[activeSlide]} style={styles.heroImage} resizeMode="cover" />
            </Animated.View>

            {/* Continuous bottom fade gradient overlay */}
            <View
              style={[
                styles.gradientOverlay,
                webGradient as any,
              ]}
              pointerEvents="none">
              {Platform.OS !== 'web' && (
                <>
                  <View style={[styles.gradientStep, { backgroundColor: `rgba(${rgbBase}, 0.15)`, bottom: 65, height: 25 }]} />
                  <View style={[styles.gradientStep, { backgroundColor: `rgba(${rgbBase}, 0.45)`, bottom: 40, height: 28 }]} />
                  <View style={[styles.gradientStep, { backgroundColor: `rgba(${rgbBase}, 0.78)`, bottom: 18, height: 24 }]} />
                  <View style={[styles.gradientStep, { backgroundColor: `rgba(${rgbBase}, 1.0)`, bottom: 0, height: 20 }]} />
                </>
              )}
            </View>

            {/* Unobtrusive Floating Theme Toggle */}
            <View style={styles.topControlRow}>
              <View style={[styles.logoPill, { backgroundColor: t.isDark ? 'rgba(8, 13, 11, 0.65)' : 'rgba(255, 255, 255, 0.75)' }]}>
                <Ionicons name="fitness" size={14} color={t.isDark ? t.primaryLime : t.primaryGreen} />
                <Text style={[styles.logoPillText, { color: t.textPrimary }]}>FitTrack</Text>
              </View>
              <ThemeToggle />
            </View>
            <View style={styles.pagination} pointerEvents="none">
              {FITNESS_JOURNEY_IMAGES.map((_, index) => (
                <View key={index} style={[styles.dot, { backgroundColor: index === activeSlide ? (t.isDark ? t.primaryLime : t.primaryGreen) : 'rgba(255,255,255,0.5)' }]} />
              ))}
            </View>
          </Animated.View>

          {/* ========================================================= */}
          {/* 2. CONTENT SECTION (Badge, Bold Heading, Subtitle)        */}
          {/* ========================================================= */}
          <Animated.View
            style={[
              styles.contentSection,
              {
                opacity: contentAnim,
                transform: [{ translateY: contentTranslate }],
              },
            ]}>

            {/* Small Badge */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: t.limeDim,
                  borderColor: t.isDark ? t.limeBorder : t.border,
                },
              ]}>
              <Ionicons
                name="flash"
                size={11}
                color={t.isDark ? t.primaryLime : t.primaryGreen}
                style={styles.badgeIcon}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: t.isDark ? t.primaryLime : t.primaryGreen },
                ]}>
                GET STARTED
              </Text>
            </View>

            {/* Main Heading */}
            <Text style={[styles.heading, { color: t.textPrimary }]}>
              Let’s personalize{'\n'}your fitness journey
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: t.textSecondary }]}>
              We’ll ask a few quick questions to create a workout plan based on your level, goal, and available time.
            </Text>

            {/* ========================================================= */}
            {/* 3. SMALL INFO ROW (3 compact items with icons)            */}
            {/* ========================================================= */}
            <View style={styles.infoRowContainer}>
              {/* Item 1: Fitness Level */}
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: t.surfaceElevated,
                    borderColor: t.border,
                  },
                ]}>
                <View
                  style={[
                    styles.infoIconBox,
                    { backgroundColor: t.isDark ? 'rgba(184, 245, 42, 0.12)' : 'rgba(111, 163, 19, 0.12)' },
                  ]}>
                  <Ionicons
                    name="body-outline"
                    size={15}
                    color={t.isDark ? t.primaryLime : t.primaryGreen}
                  />
                </View>
                <Text style={[styles.infoLabel, { color: t.textPrimary }]}>Fitness Level</Text>
                <Text style={[styles.infoSubtext, { color: t.textMuted }]}>3 Options</Text>
              </View>

              {/* Item 2: Your Goal */}
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: t.surfaceElevated,
                    borderColor: t.border,
                  },
                ]}>
                <View
                  style={[
                    styles.infoIconBox,
                    { backgroundColor: t.isDark ? 'rgba(54, 184, 158, 0.15)' : 'rgba(39, 143, 122, 0.15)' },
                  ]}>
                  <Ionicons
                    name="locate-outline"
                    size={15}
                    color={t.secondaryTeal}
                  />
                </View>
                <Text style={[styles.infoLabel, { color: t.textPrimary }]}>Your Goal</Text>
                <Text style={[styles.infoSubtext, { color: t.textMuted }]}>Customized</Text>
              </View>

              {/* Item 3: Available Time */}
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: t.surfaceElevated,
                    borderColor: t.border,
                  },
                ]}>
                <View
                  style={[
                    styles.infoIconBox,
                    { backgroundColor: t.isDark ? 'rgba(184, 245, 42, 0.12)' : 'rgba(111, 163, 19, 0.12)' },
                  ]}>
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={t.isDark ? t.primaryLime : t.primaryGreen}
                  />
                </View>
                <Text style={[styles.infoLabel, { color: t.textPrimary }]}>Available Time</Text>
                <Text style={[styles.infoSubtext, { color: t.textMuted }]}>Flexible</Text>
              </View>
            </View>

          </Animated.View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* ========================================================= */}
          {/* 4. CTA BUTTON (NEXT →)                                    */}
          {/* ========================================================= */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: footerAnim,
                transform: [{ translateY: footerTranslate }],
              },
            ]}>
            <PrimaryButton
              title="NEXT →"
              onPress={handleNext}
            />
          </Animated.View>

        </ScrollView>
      </MobileScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  heroContainer: {
    width: '100%',
    position: 'relative',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#0D1311',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  pagination: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  gradientStep: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  topControlRow: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  logoPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19.5,
    marginBottom: 18,
  },
  infoRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  infoCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});

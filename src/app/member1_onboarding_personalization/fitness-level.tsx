import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { saveOnboardingData } from '@/features/member1/utils/onboarding-store';
import { useTheme } from '@/constants/theme';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { OnboardingProgress } from '@/components/member1/OnboardingProgress';
import { PrimaryButton } from '@/components/member1/PrimaryButton';
import { ThemeToggle } from '@/components/member1/ThemeToggle';
import { Ionicons } from '@expo/vector-icons';

// ── Images ──────────────────────────────────────
const IMG_BEGINNER = require('../../../assets/images/png1.png');
const IMG_INTERMEDIATE = require('../../../assets/images/png2.png');
const IMG_ADVANCED = require('../../../assets/images/png3.png');

// ── Types ───────────────────────────────────────
type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

interface LevelOption {
  key: FitnessLevel;
  title: string;
  description: string;
  detail: string;
  tag: string;
  image: ImageSourcePropType;
}

const LEVELS: LevelOption[] = [
  {
    key: 'beginner',
    title: 'Beginner',
    description: 'New to fitness or just getting started with regular exercise.',
    detail: 'Best for learning basic movements and building consistency.',
    tag: 'Starter',
    image: IMG_BEGINNER,
  },
  {
    key: 'intermediate',
    title: 'Intermediate',
    description: 'You already exercise sometimes and know the basic workout movements.',
    detail: 'Best for improving strength, stamina, and workout consistency.',
    tag: 'Progressing',
    image: IMG_INTERMEDIATE,
  },
  {
    key: 'advanced',
    title: 'Advanced',
    description: 'You train regularly and are comfortable with challenging workouts.',
    detail: 'Best for higher intensity, strength, and performance-focused training.',
    tag: 'Experienced',
    image: IMG_ADVANCED,
  },
];

// ── Card component ──────────────────────────────
interface LevelCardProps {
  option: LevelOption;
  selected: boolean;
  onSelect: () => void;
  isDark: boolean;
  theme: ReturnType<typeof useTheme>;
}

function LevelCard({ option, selected, onSelect, isDark, theme: t }: LevelCardProps) {
  const [scale] = React.useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const accentColor = isDark ? t.primaryLime : t.primaryGreen;

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 12 }}>
      <Pressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        style={[
          styles.card,
          {
            backgroundColor: selected
              ? (isDark ? 'rgba(184, 245, 42, 0.08)' : 'rgba(111, 163, 19, 0.06)')
              : (isDark ? t.surface : t.cardBg),
            borderColor: selected ? accentColor : t.cardBorder,
            borderWidth: selected ? 1.5 : 1,
          },
        ]}>
        {/* ── Left image ── */}
        <View
          style={[
            styles.imageWrapper,
            {
              borderColor: selected
                ? (isDark ? 'rgba(184, 245, 42, 0.35)' : 'rgba(111, 163, 19, 0.25)')
                : t.border,
            },
          ]}>
          <Image source={option.image} style={styles.cardImage} resizeMode="cover" />
        </View>

        {/* ── Centre text ── */}
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.cardTitle,
                { color: selected ? accentColor : t.textPrimary },
              ]}
              numberOfLines={1}>
              {option.title}
            </Text>
            <View
              style={[
                styles.tagBadge,
                {
                  backgroundColor: selected
                    ? (isDark ? 'rgba(184, 245, 42, 0.15)' : 'rgba(111, 163, 19, 0.12)')
                    : (isDark ? t.surfaceElevated : t.secondaryBackground),
                },
              ]}>
              <Text
                style={[
                  styles.tagText,
                  { color: selected ? accentColor : t.textMuted },
                ]}>
                {option.tag}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.cardDescription, { color: t.textSecondary }]}
            numberOfLines={2}>
            {option.description}
          </Text>

          <Text
            style={[styles.cardDetail, { color: t.textMuted }]}
            numberOfLines={1}>
            {option.detail}
          </Text>
        </View>

        {/* ── Right radio / check ── */}
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? accentColor : t.border,
              backgroundColor: selected ? accentColor : 'transparent',
            },
          ]}>
          {selected && <Ionicons name="checkmark" size={13} color={isDark ? '#080D0B' : '#FFFFFF'} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ──────────────────────────────────────
export default function FitnessLevelScreen() {
  const t = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel>('beginner');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]}>
      <MobileScreenContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}>

          {/* ── Header row ── */}
          <View style={styles.topHeader}>
            <View style={{ flex: 1 }}>
              <OnboardingProgress currentStep={2} />
            </View>
            <ThemeToggle style={styles.themeToggle} />
          </View>

          {/* ── Title & subtitle ── */}
          <Text style={[styles.heading, { color: t.textPrimary }]}>
            What&apos;s your fitness level?
          </Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            Choose the level that best matches your current workout experience.
          </Text>

          {/* ── Level cards ── */}
          <View style={styles.optionsContainer}>
            {LEVELS.map((lvl) => (
              <LevelCard
                key={lvl.key}
                option={lvl}
                selected={selectedLevel === lvl.key}
                onSelect={() => setSelectedLevel(lvl.key)}
                isDark={t.isDark}
                theme={t}
              />
            ))}
          </View>

          {/* ── Info row ── */}
          <View
            style={[
              styles.infoRow,
              { backgroundColor: t.surfaceElevated, borderColor: t.border },
            ]}>
            <Ionicons name="information-circle-outline" size={16} color={t.secondaryTeal} />
            <Text style={[styles.infoText, { color: t.textSecondary }]}>
              You can change your fitness level later in your profile.
            </Text>
          </View>

          <View style={styles.spacer} />

          {/* ── CTA ── */}
          <View style={styles.footer}>
            <PrimaryButton
              title="NEXT →"
              onPress={async () => {
                await saveOnboardingData({ fitnessLevel: selectedLevel });
                router.push('/member1_onboarding_personalization/fitness-goal');
              }}
            />
          </View>
        </ScrollView>
      </MobileScreenContainer>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  themeToggle: {
    position: 'absolute',
    right: 0,
  },

  /* Title */
  heading: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 6,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 20,
  },

  /* Cards container */
  optionsContainer: {
    marginBottom: 16,
  },

  /* ── Individual card ── */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    minHeight: 100,
  },

  /* Left image */
  imageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    flexShrink: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },

  /* Centre text */
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 10.5,
    lineHeight: 14,
    fontStyle: 'italic',
  },

  /* Right radio */
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* Info */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    alignSelf: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },

  /* Footer */
  spacer: { flex: 1, minHeight: 32 },
  footer: { paddingTop: 12 },
});

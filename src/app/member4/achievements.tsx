import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  AchievementBadge,
  type AchievementItem,
} from '@/features/member4/components/AchievementBadge';
import { BadgeDetailModal } from '@/features/member4/components/BadgeDetailModal';
import { FitnessIcon } from '@/features/member4/components/FitnessIcon';
import { M4Screen } from '@/features/member4/components/M4Screen';
import {
  ProfilePressable,
  ProfileProgressBar,
  ProfileReveal,
} from '@/features/member4/components/ProfileMotion';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';

type AchievementFilter =
  | 'All'
  | 'Streak'
  | 'Training'
  | 'Energy'
  | 'Consistency';

const TOTAL_BADGES = 20;

const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'first-workout',
    title: 'First Workout',
    category: 'Training',
    description:
      'Completed your first FitTrack workout and officially started your fitness journey.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 02, 2026',
    icon: 'check',
    targetLabel: 'Complete your first workout',
    currentLabel: '1 / 1 workout',
  },

  {
    id: 'seven-day-streak',
    title: '7-Day Streak',
    category: 'Streak',
    description:
      'Completed workouts 7 days in a row without missing a single day. Consistency is the foundation of progress.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 17, 2026',
    icon: 'flame',
    targetLabel: 'Train 7 days in a row',
    currentLabel: '7 / 7 days',
  },

  {
    id: 'early-bird',
    title: 'Early Bird',
    category: 'Consistency',
    description:
      'Completed five workouts before 8:00 AM and proved that strong days can start early.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 12, 2026',
    icon: 'spark',
    targetLabel: 'Complete 5 early workouts',
    currentLabel: '5 / 5 workouts',
  },

  {
    id: 'ten-workouts',
    title: '10 Workouts',
    category: 'Training',
    description:
      'Completed your first ten workout sessions and built a strong training foundation.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 21, 2026',
    icon: 'workouts',
    targetLabel: 'Complete 10 workouts',
    currentLabel: '10 / 10 workouts',
  },

  {
    id: 'calorie-crusher',
    title: 'Calorie Crusher',
    category: 'Energy',
    description:
      'Burned more than 3,000 active workout calories through consistent training.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 24, 2026',
    icon: 'flame',
    targetLabel: 'Burn 3,000 workout calories',
    currentLabel: '3,000 / 3,000 kcal',
  },

  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    category: 'Consistency',
    description:
      'Stayed active across four different weekends instead of letting the weekend stop your momentum.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 27, 2026',
    icon: 'calendar',
    targetLabel: 'Train across 4 weekends',
    currentLabel: '4 / 4 weekends',
  },

  {
    id: 'goal-getter',
    title: 'Goal Getter',
    category: 'Consistency',
    description:
      'Completed your first personal fitness goal inside FitTrack.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 29, 2026',
    icon: 'goal',
    targetLabel: 'Complete one fitness goal',
    currentLabel: '1 / 1 goal',
  },

  {
    id: 'momentum-builder',
    title: 'Momentum Builder',
    category: 'Training',
    description:
      'Completed four workouts in one week and maintained strong weekly momentum.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Oct 01, 2026',
    icon: 'trend-up',
    targetLabel: 'Complete 4 workouts in a week',
    currentLabel: '4 / 4 workouts',
  },

  {
    id: 'thirty-day-streak',
    title: '30-Day Streak',
    category: 'Streak',
    description:
      'Build an exceptional training habit by staying active for 30 consecutive days.',
    unlocked: false,
    progress: 20,
    icon: 'flame',
    targetLabel: 'Train for 30 consecutive days',
    currentLabel: '6 / 30 days',
  },

  {
    id: 'fifty-workouts',
    title: '50 Workouts',
    category: 'Training',
    description:
      'Complete fifty workout sessions and reach a major FitTrack training milestone.',
    unlocked: false,
    progress: 24,
    icon: 'workouts',
    targetLabel: 'Complete 50 workouts',
    currentLabel: '12 / 50 workouts',
  },

  {
    id: 'marathon-mind',
    title: 'Marathon Mind',
    category: 'Consistency',
    description:
      'Accumulate 500 total workout minutes and prove that long-term effort adds up.',
    unlocked: false,
    progress: 64,
    icon: 'trend-up',
    targetLabel: 'Complete 500 workout minutes',
    currentLabel: '320 / 500 min',
  },
];

const FILTERS: AchievementFilter[] = [
  'All',
  'Streak',
  'Training',
  'Energy',
  'Consistency',
];

function LivePulse() {
  const c = useM4Theme();

  const pulse = useSharedValue(0);

  pulse.value = withRepeat(
    withSequence(
      withTiming(1, {
        duration: 1300,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(0, {
        duration: 200,
      }),
    ),
    -1,
    false,
  );

  const animatedRing = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [
      {
        scale: 1 + pulse.value * 0.65,
      },
    ],
  }));

  return (
    <View style={styles.livePulseWrap}>
      <Animated.View
        style={[
          styles.livePulseRing,
          {
            borderColor: c.teal,
          },
          animatedRing,
        ]}
      />

      <View
        style={[
          styles.livePulseDot,
          {
            backgroundColor: c.teal,
          },
        ]}
      />
    </View>
  );
}

export default function AchievementsScreen() {
  const c = useM4Theme();
  const { width } = useWindowDimensions();

  const compact = width < 370;

  const [selectedFilter, setSelectedFilter] =
    useState<AchievementFilter>('All');

  const [selectedAchievement, setSelectedAchievement] =
    useState<AchievementItem | null>(null);

  const unlockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((item) => item.unlocked),
    [],
  );

  const lockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((item) => !item.unlocked),
    [],
  );

  const earnedCount = unlockedAchievements.length;

  const completionPercent = Math.round(
    (earnedCount / TOTAL_BADGES) * 100,
  );

  const filteredAchievements = useMemo(() => {
    if (selectedFilter === 'All') {
      return ACHIEVEMENTS;
    }

    return ACHIEVEMENTS.filter(
      (achievement) =>
        achievement.category === selectedFilter,
    );
  }, [selectedFilter]);

  const featuredUnlocked = unlockedAchievements.find(
    (achievement) =>
      achievement.id === 'seven-day-streak',
  );

  const nextAchievement = useMemo(() => {
    if (!lockedAchievements.length) {
      return null;
    }

    return [...lockedAchievements].sort(
      (a, b) => b.progress - a.progress,
    )[0];
  }, [lockedAchievements]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/member4/progress');
  }

  function handleAchievementPress(
    achievement: AchievementItem,
  ) {
    if (!achievement.unlocked) {
      return;
    }

    setSelectedAchievement(achievement);
  }

  return (
    <M4Screen>
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            borderBottomColor: c.border,
          },
        ]}
      >
        <ProfilePressable
          label="Go back"
          onPress={goBack}
          style={[
            styles.headerButton,
            {
              backgroundColor: c.cardBg,
              borderColor: c.cardBdr,
            },
          ]}
        >
          <FitnessIcon
            name="arrow-left"
            color={c.text}
            size={20}
          />
        </ProfilePressable>

        <View style={styles.headerCopy}>
          <Text
            style={[
              styles.headerEyebrow,
              {
                color: c.muted,
              },
            ]}
          >
            FITTRACK / REWARDS
          </Text>

          <Text
            accessibilityRole="header"
            style={[
              styles.headerTitle,
              {
                color: c.text,
              },
            ]}
          >
            Achievements.
          </Text>
        </View>

        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor: c.tealDim,
              borderColor: c.teal,
            },
          ]}
        >
          <FitnessIcon
            name="spark"
            color={c.teal}
            size={21}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* COLLECTION HERO */}

        <ProfileReveal>
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: c.cardBg,
                borderColor: c.cardBdr,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.heroGlow,
                {
                  backgroundColor: c.tealDim,
                },
              ]}
            />

            <View style={styles.heroTop}>
              <View>
                <Text
                  style={[
                    styles.heroEyebrow,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  BADGE COLLECTION
                </Text>

                <Text
                  style={[
                    styles.heroTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Your work is{'\n'}turning into proof.
                </Text>
              </View>

              <View
                style={[
                  styles.heroMedal,
                  {
                    backgroundColor: c.tealDim,
                    borderColor: c.teal,
                  },
                ]}
              >
                <LivePulse />

                <FitnessIcon
                  name="goal"
                  color={c.teal}
                  size={30}
                />
              </View>
            </View>

            <View
              style={[
                styles.heroStats,
                compact && styles.heroStatsCompact,
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.heroStatLabel,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  BADGES EARNED
                </Text>

                <View style={styles.heroNumberRow}>
                  <Text
                    style={[
                      styles.heroNumber,
                      {
                        color: c.text,
                      },
                    ]}
                  >
                    {earnedCount}
                  </Text>

                  <Text
                    style={[
                      styles.heroTotal,
                      {
                        color: c.muted,
                      },
                    ]}
                  >
                    / {TOTAL_BADGES}
                  </Text>
                </View>
              </View>

              <View style={styles.heroPercentArea}>
                <Text
                  style={[
                    styles.heroPercent,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  {completionPercent}%
                </Text>

                <Text
                  style={[
                    styles.heroPercentLabel,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  collection complete
                </Text>
              </View>
            </View>

            <View style={styles.heroProgress}>
              <ProfileProgressBar
                value={completionPercent}
                color={c.teal}
                trackColor={c.border}
                label="Achievement collection progress"
              />
            </View>

            <View style={styles.heroFooter}>
              <View style={styles.heroLiveRow}>
                <LivePulse />

                <Text
                  style={[
                    styles.heroLiveText,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  New badges unlock automatically as you train
                </Text>
              </View>

              <View
                style={[
                  styles.heroCountPill,
                  {
                    backgroundColor: c.tealDim,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.heroCountText,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  {TOTAL_BADGES - earnedCount} left
                </Text>
              </View>
            </View>
          </View>
        </ProfileReveal>

        {/* RECENTLY EARNED */}

        {featuredUnlocked && (
          <ProfileReveal delay={60}>
            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionEyebrow,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  RECENTLY EARNED
                </Text>

                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Latest milestone
                </Text>
              </View>

              <View
                style={[
                  styles.newBadge,
                  {
                    backgroundColor: c.tealDim,
                  },
                ]}
              >
                <LivePulse />

                <Text
                  style={[
                    styles.newBadgeText,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  NEW
                </Text>
              </View>
            </View>

            <ProfilePressable
              label={`Open ${featuredUnlocked.title}`}
              onPress={() =>
                handleAchievementPress(featuredUnlocked)
              }
              style={[
                styles.recentCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.teal,
                  shadowColor: c.teal,
                },
              ]}
            >
              <View
                style={[
                  styles.recentIcon,
                  {
                    backgroundColor: c.tealDim,
                  },
                ]}
              >
                <LivePulse />

                <FitnessIcon
                  name={featuredUnlocked.icon}
                  color={c.teal}
                  size={28}
                />
              </View>

              <View style={styles.recentCopy}>
                <Text
                  style={[
                    styles.recentLabel,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  STREAK BADGE
                </Text>

                <Text
                  style={[
                    styles.recentTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  {featuredUnlocked.title}
                </Text>

                <Text
                  style={[
                    styles.recentDescription,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  Earned 2 days ago
                </Text>
              </View>

              <View
                style={[
                  styles.recentArrow,
                  {
                    backgroundColor: c.surface,
                    borderColor: c.border,
                  },
                ]}
              >
                <FitnessIcon
                  name="chevron"
                  color={c.teal}
                  size={17}
                />
              </View>
            </ProfilePressable>
          </ProfileReveal>
        )}

        {/* NEXT BADGE */}

        {nextAchievement && (
          <ProfileReveal delay={100}>
            <View
              style={[
                styles.nextCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
                },
              ]}
            >
              <View style={styles.nextTop}>
                <View style={styles.nextHeading}>
                  <View
                    style={[
                      styles.nextIcon,
                      {
                        backgroundColor: c.tealDim,
                      },
                    ]}
                  >
                    <FitnessIcon
                      name={nextAchievement.icon}
                      color={c.teal}
                      size={20}
                    />
                  </View>

                  <View style={styles.nextCopy}>
                    <Text
                      style={[
                        styles.nextEyebrow,
                        {
                          color: c.muted,
                        },
                      ]}
                    >
                      CLOSEST TO UNLOCK
                    </Text>

                    <Text
                      style={[
                        styles.nextTitle,
                        {
                          color: c.text,
                        },
                      ]}
                    >
                      {nextAchievement.title}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.nextPercent,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  {nextAchievement.progress}%
                </Text>
              </View>

              <ProfileProgressBar
                value={nextAchievement.progress}
                color={c.teal}
                trackColor={c.border}
                label={`${nextAchievement.title} progress`}
              />

              <View style={styles.nextFooter}>
                <Text
                  style={[
                    styles.nextCurrent,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  {nextAchievement.currentLabel}
                </Text>

                <Text
                  style={[
                    styles.nextTarget,
                    {
                      color: c.subtle,
                    },
                  ]}
                >
                  {nextAchievement.targetLabel}
                </Text>
              </View>
            </View>
          </ProfileReveal>
        )}

        {/* FILTERS */}

        <ProfileReveal delay={140}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color: c.muted,
                  },
                ]}
              >
                YOUR COLLECTION
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                All badges
              </Text>
            </View>

            <View
              style={[
                styles.totalPill,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.totalPillText,
                  {
                    color: c.muted,
                  },
                ]}
              >
                {filteredAchievements.length}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((filter) => {
              const selected = selectedFilter === filter;

              return (
                <Pressable
                  key={filter}
                  onPress={() =>
                    setSelectedFilter(filter)
                  }
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      backgroundColor: selected
                        ? c.teal
                        : pressed
                          ? c.tealDim
                          : c.cardBg,
                      borderColor: selected
                        ? c.teal
                        : c.cardBdr,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: selected
                          ? '#07130F'
                          : c.muted,
                      },
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </ProfileReveal>

        {/* BADGE GRID */}

        <View style={styles.badgeGrid}>
          {filteredAchievements.map(
            (achievement, index) => (
              <View
                key={achievement.id}
                style={styles.badgeGridItem}
              >
                <ProfileReveal
                  delay={170 + index * 35}
                >
                  <AchievementBadge
                    achievement={achievement}
                    onPress={handleAchievementPress}
                  />
                </ProfileReveal>
              </View>
            ),
          )}
        </View>

        {/* MOTIVATION */}

        <ProfileReveal delay={260}>
          <View
            style={[
              styles.motivationCard,
              {
                backgroundColor: c.cardBg,
                borderColor: c.cardBdr,
              },
            ]}
          >
            <View
              style={[
                styles.motivationIcon,
                {
                  backgroundColor: c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name="spark"
                color={c.teal}
                size={22}
              />
            </View>

            <View style={styles.motivationCopy}>
              <Text
                style={[
                  styles.motivationTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Every badge tells a story.
              </Text>

              <Text
                style={[
                  styles.motivationText,
                  {
                    color: c.muted,
                  },
                ]}
              >
                You do not need to unlock everything at once.
                Keep training and let the collection grow with
                you.
              </Text>
            </View>
          </View>
        </ProfileReveal>
      </ScrollView>

      <BadgeDetailModal
        achievement={selectedAchievement}
        visible={selectedAchievement !== null}
        onClose={() => setSelectedAchievement(null)}
      />
    </M4Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCopy: {
    flex: 1,
  },

  headerEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.25,
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
    marginBottom: 24,
  },

  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -125,
    right: -70,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },

  heroEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.45,
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  heroMedal: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroStats: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },

  heroStatsCompact: {
    alignItems: 'flex-start',
  },

  heroStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  heroNumberRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  heroNumber: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
  },

  heroTotal: {
    fontSize: 18,
    fontWeight: '700',
  },

  heroPercentArea: {
    alignItems: 'flex-end',
  },

  heroPercent: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },

  heroPercentLabel: {
    marginTop: 1,
    fontSize: 10,
  },

  heroProgress: {
    marginTop: 18,
  },

  heroFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  heroLiveRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  heroLiveText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },

  heroCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  heroCountText: {
    fontSize: 9,
    fontWeight: '800',
  },

  livePulseWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  livePulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },

  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  sectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },

  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  newBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  newBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  recentCard: {
    minHeight: 96,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 2,
  },

  recentIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recentCopy: {
    flex: 1,
  },

  recentLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  recentTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: '800',
  },

  recentDescription: {
    marginTop: 3,
    fontSize: 10,
  },

  recentArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
  },

  nextTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },

  nextHeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  nextIcon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextCopy: {
    flex: 1,
  },

  nextEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  nextTitle: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
  },

  nextPercent: {
    fontSize: 20,
    fontWeight: '900',
  },

  nextFooter: {
    marginTop: 10,
  },

  nextCurrent: {
    fontSize: 10,
    fontWeight: '700',
  },

  nextTarget: {
    marginTop: 2,
    fontSize: 9,
  },

  totalPill: {
    minWidth: 31,
    height: 31,
    paddingHorizontal: 9,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  totalPillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  filterRow: {
    gap: 7,
    paddingBottom: 14,
  },

  filterChip: {
    minHeight: 35,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterText: {
    fontSize: 10,
    fontWeight: '800',
  },

  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },

  badgeGridItem: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },

  motivationCard: {
    marginTop: 12,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  motivationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  motivationCopy: {
    flex: 1,
  },

  motivationTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  motivationText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
  },
});
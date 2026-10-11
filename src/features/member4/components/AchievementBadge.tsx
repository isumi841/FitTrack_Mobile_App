import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
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
  FitnessIcon,
  type FitnessIconName,
} from './FitnessIcon';

import { ProfileProgressBar } from './ProfileMotion';

import { useM4Theme } from '../hooks/useM4Theme';

export type AchievementItem = {
  id: string;
  title: string;
  category:
    | 'Streak'
    | 'Training'
    | 'Energy'
    | 'Consistency';

  description: string;

  unlocked: boolean;

  progress: number;

  earnedOn?: string;

  icon: FitnessIconName;

  targetLabel: string;

  currentLabel?: string;
};

interface AchievementBadgeProps {
  achievement: AchievementItem;

  onPress?: (
    achievement: AchievementItem,
  ) => void;
}

export function AchievementBadge({
  achievement,
  onPress,
}: AchievementBadgeProps) {
  const c = useM4Theme();

  const floatValue = useSharedValue(0);

  useEffect(() => {
    if (!achievement.unlocked) {
      floatValue.value = 0;
      return;
    }

    floatValue.value = withRepeat(
      withSequence(
        withTiming(-3, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [achievement.unlocked, floatValue]);

  const iconAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: floatValue.value,
        },
      ],
    }),
  );

  const canOpen =
    achievement.unlocked && Boolean(onPress);

  return (
    <Pressable
      disabled={!canOpen}
      accessibilityRole={
        canOpen ? 'button' : undefined
      }
      accessibilityLabel={
        achievement.unlocked
          ? `Open ${achievement.title} achievement`
          : `${achievement.title} locked`
      }
      onPress={() => {
        if (canOpen) {
          onPress?.(achievement);
        }
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.cardBg,
          borderColor: achievement.unlocked
            ? c.teal
            : c.cardBdr,
          opacity:
            pressed && canOpen
              ? 0.82
              : 1,
        },
      ]}
    >
      {/* ICON */}

      <View style={styles.iconSection}>
        <Animated.View
          style={[
            styles.iconTile,
            {
              backgroundColor: achievement.unlocked
                ? c.tealDim
                : c.surface,
              borderColor: achievement.unlocked
                ? c.teal
                : c.border,
            },
            iconAnimatedStyle,
          ]}
        >
          <FitnessIcon
            name={achievement.icon}
            color={
              achievement.unlocked
                ? c.teal
                : c.subtle
            }
            size={27}
          />
        </Animated.View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: achievement.unlocked
                ? c.tealDim
                : c.surface,
              borderColor: achievement.unlocked
                ? c.teal
                : c.border,
            },
          ]}
        >
          {achievement.unlocked ? (
            <FitnessIcon
              name="check"
              color={c.teal}
              size={12}
            />
          ) : (
            <View
              style={[
                styles.lockDot,
                {
                  backgroundColor: c.subtle,
                },
              ]}
            />
          )}
        </View>
      </View>

      {/* CONTENT */}

      <Text
        numberOfLines={2}
        style={[
          styles.title,
          {
            color: achievement.unlocked
              ? c.text
              : c.muted,
          },
        ]}
      >
        {achievement.title}
      </Text>

      <Text
        style={[
          styles.category,
          {
            color: achievement.unlocked
              ? c.teal
              : c.subtle,
          },
        ]}
      >
        {achievement.category.toUpperCase()}
      </Text>

      {achievement.unlocked ? (
        <>
          <View
            style={[
              styles.earnedDivider,
              {
                backgroundColor: c.border,
              },
            ]}
          />

          <View style={styles.earnedRow}>
            <FitnessIcon
              name="check"
              color={c.teal}
              size={13}
            />

            <Text
              style={[
                styles.earnedText,
                {
                  color: c.muted,
                },
              ]}
            >
              Unlocked
            </Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.progressWrap}>
            <ProfileProgressBar
              value={achievement.progress}
              color={c.teal}
              trackColor={c.border}
              label={`${achievement.title} progress`}
            />
          </View>

          <View style={styles.lockedFooter}>
            <Text
              style={[
                styles.progressText,
                {
                  color: c.muted,
                },
              ]}
            >
              {achievement.progress}%
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.currentText,
                {
                  color: c.subtle,
                },
              ]}
            >
              {achievement.currentLabel}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 205,
    borderWidth: 1,
    borderRadius: 21,
    padding: 14,
  },

  iconSection: {
    position: 'relative',
    alignSelf: 'flex-start',
  },

  iconTile: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusBadge: {
    position: 'absolute',
    right: -5,
    bottom: -4,
    width: 23,
    height: 23,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  title: {
    marginTop: 15,
    minHeight: 38,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  category: {
    marginTop: 4,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  earnedDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 16,
    marginBottom: 10,
  },

  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  earnedText: {
    fontSize: 9,
    fontWeight: '700',
  },

  progressWrap: {
    marginTop: 15,
  },

  lockedFooter: {
    marginTop: 7,
  },

  progressText: {
    fontSize: 10,
    fontWeight: '800',
  },

  currentText: {
    marginTop: 2,
    fontSize: 8,
  },
});
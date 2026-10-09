import { useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { FitnessIcon } from './FitnessIcon';

import type { AchievementItem } from './AchievementBadge';

import { useM4Theme } from '../hooks/useM4Theme';

interface BadgeDetailModalProps {
  visible: boolean;

  achievement: AchievementItem | null;

  onClose: () => void;
}

export function BadgeDetailModal({
  visible,
  achievement,
  onClose,
}: BadgeDetailModalProps) {
  const c = useM4Theme();

  const glow = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      glow.value = 0;
      return;
    }

    glow.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [glow, visible]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + glow.value * 0.18,

    transform: [
      {
        scale: 1 + glow.value * 0.12,
      },
    ],
  }));

  if (!visible || !achievement) {
      return null;
    }

    const activeAchievement = achievement;

    async function handleShare() {
      try {
        await Share.share({
          message:
            `FitTrack Achievement: ${activeAchievement.title}\n\n` +
            `${activeAchievement.description}\n\n` +
            `Earned on ${activeAchievement.earnedOn ?? 'recently'}.`,
        });
      } catch {
        // Share dismissal/errors do not need to interrupt the UI.
      }
    }

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* BACKDROP */}

      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(150)}
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          {
            backgroundColor: c.overlay,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close achievement details"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* MODAL */}

      <View
        pointerEvents="box-none"
        style={styles.modalContainer}
      >
        <Animated.View
          entering={FadeInDown
            .duration(300)
            .springify()
            .damping(18)}
          style={[
            styles.card,
            {
              backgroundColor: c.bg2,
              borderColor: c.cardBdr,
            },
          ]}
        >
          {/* CLOSE */}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close achievement"
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: pressed
                  ? c.tealDim
                  : c.surface,
                borderColor: c.border,
              },
            ]}
          >
            <Text
              style={[
                styles.closeText,
                {
                  color: c.muted,
                },
              ]}
            >
              ×
            </Text>
          </Pressable>

          {/* BADGE VISUAL */}

          <View style={styles.badgeArea}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.badgeGlow,
                {
                  backgroundColor: c.teal,
                },
                glowStyle,
              ]}
            />

            <View
              style={[
                styles.badgeCircle,
                {
                  backgroundColor: c.tealDim,
                  borderColor: c.teal,
                },
              ]}
            >
              <FitnessIcon
                name={achievement.icon}
                color={c.teal}
                size={43}
              />
            </View>

            <View
              style={[
                styles.badgeCheck,
                {
                  backgroundColor: c.teal,
                  borderColor: c.bg2,
                },
              ]}
            >
              <FitnessIcon
                name="check"
                color="#07130F"
                size={15}
              />
            </View>
          </View>

          {/* CATEGORY */}

          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: c.tealDim,
              },
            ]}
          >
            <View
              style={[
                styles.categoryDot,
                {
                  backgroundColor: c.teal,
                },
              ]}
            />

            <Text
              style={[
                styles.categoryText,
                {
                  color: c.teal,
                },
              ]}
            >
              {achievement.category.toUpperCase()} BADGE
            </Text>
          </View>

          {/* TITLE */}

          <Text
            style={[
              styles.title,
              {
                color: c.text,
              },
            ]}
          >
            {achievement.title}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: c.muted,
              },
            ]}
          >
            {achievement.description}
          </Text>

          {/* EARNED DATE */}

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: c.cardBg,
                borderColor: c.cardBdr,
              },
            ]}
          >
            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor: c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name="calendar"
                color={c.teal}
                size={18}
              />
            </View>

            <View style={styles.infoCopy}>
              <Text
                style={[
                  styles.infoLabel,
                  {
                    color: c.subtle,
                  },
                ]}
              >
                EARNED ON
              </Text>

              <Text
                style={[
                  styles.infoValue,
                  {
                    color: c.text,
                  },
                ]}
              >
                {achievement.earnedOn ?? 'Recently'}
              </Text>
            </View>

            <FitnessIcon
              name="check"
              color={c.teal}
              size={18}
            />
          </View>

          {/* TARGET */}

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: c.cardBg,
                borderColor: c.cardBdr,
              },
            ]}
          >
            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor: c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name="goal"
                color={c.teal}
                size={18}
              />
            </View>

            <View style={styles.infoCopy}>
              <Text
                style={[
                  styles.infoLabel,
                  {
                    color: c.subtle,
                  },
                ]}
              >
                CHALLENGE
              </Text>

              <Text
                style={[
                  styles.infoValue,
                  {
                    color: c.text,
                  },
                ]}
              >
                {achievement.targetLabel}
              </Text>
            </View>
          </View>

          {/* COMPLETE */}

          <View style={styles.completeRow}>
            <FitnessIcon
              name="spark"
              color={c.teal}
              size={16}
            />

            <Text
              style={[
                styles.completeText,
                {
                  color: c.teal,
                },
              ]}
            >
              Challenge completed successfully
            </Text>
          </View>

          {/* SHARE */}

          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel={`Share ${achievement.title}`}
            style={({ pressed }) => [
              styles.shareButton,
              {
                backgroundColor: pressed
                  ? c.tealDim
                  : c.teal,
                borderColor: c.teal,
                shadowColor: c.teal,
              },
            ]}
          >
            <FitnessIcon
              name="spark"
              color="#07130F"
              size={18}
            />

            <Text style={styles.shareText}>
              Share Achievement
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.doneButton}
          >
            <Text
              style={[
                styles.doneText,
                {
                  color: c.muted,
                },
              ]}
            >
              Close
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    zIndex: 1,
  },

  modalContainer: {
    flex: 1,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },

  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 27,
    paddingBottom:
      Platform.OS === 'ios'
        ? 22
        : 19,
    alignItems: 'center',
  },

  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  closeText: {
    fontSize: 23,
    fontWeight: '300',
    lineHeight: 25,
  },

  badgeArea: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },

  badgeGlow: {
    position: 'absolute',
    width: 102,
    height: 102,
    borderRadius: 51,
  },

  badgeCircle: {
    width: 82,
    height: 82,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeCheck: {
    position: 'absolute',
    right: 10,
    bottom: 9,
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryPill: {
    marginTop: 7,
    paddingHorizontal: 11,
    minHeight: 27,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  categoryText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  title: {
    marginTop: 13,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.7,
  },

  description: {
    marginTop: 8,
    maxWidth: 340,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },

  infoCard: {
    width: '100%',
    minHeight: 66,
    marginTop: 13,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCopy: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  infoValue: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },

  completeRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  completeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  shareButton: {
    width: '100%',
    minHeight: 51,
    marginTop: 18,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },

  shareText: {
    color: '#07130F',
    fontSize: 12,
    fontWeight: '900',
  },

  doneButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  doneText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
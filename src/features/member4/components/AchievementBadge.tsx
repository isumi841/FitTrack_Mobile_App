/**
 * AchievementBadge – single badge tile in the achievements grid.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Achievement } from '../types';
import { useM4Theme } from '../hooks/useM4Theme';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
}

export function AchievementBadge({ achievement, onPress }: AchievementBadgeProps) {
  const c = useM4Theme();
  const { isUnlocked } = achievement;

  return (
    <Pressable
      onPress={() => isUnlocked && onPress?.(achievement)}
      style={({ pressed }) => [
        styles.badge,
        {
          backgroundColor: isUnlocked
            ? pressed
              ? c.tealDim
              : c.cardBg
            : c.surface,
          borderColor: isUnlocked ? c.teal : c.border,
          opacity: !isUnlocked ? 0.45 : 1,
          shadowColor: isUnlocked ? c.teal : 'transparent',
        },
      ]}
      disabled={!isUnlocked}
      accessibilityRole="button"
      accessibilityLabel={`${achievement.title}${isUnlocked ? ', earned' : ', locked'}`}
    >
      <Text style={styles.icon}>{achievement.icon}</Text>
      <Text
        style={[
          styles.title,
          { color: isUnlocked ? c.text : c.subtle },
        ]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
      {!isUnlocked && (
        <Text style={[styles.lock, { color: c.subtle }]}>🔒</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },
  lock: {
    fontSize: 10,
    marginTop: 2,
  },
});

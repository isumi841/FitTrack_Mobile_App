/**
 * WorkoutHistoryCard – single workout entry card for history screen.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WorkoutHistoryItem } from '../types';
import { useM4Theme } from '../hooks/useM4Theme';

interface WorkoutHistoryCardProps {
  item: WorkoutHistoryItem;
}

export function WorkoutHistoryCard({ item }: WorkoutHistoryCardProps) {
  const c = useM4Theme();
  const isCompleted = item.status === 'Completed';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.cardBg,
          borderColor: c.cardBdr,
          shadowColor: c.teal,
        },
      ]}
    >
      {/* Left accent bar */}
      <View
        style={[
          styles.accent,
          { backgroundColor: isCompleted ? c.teal : c.subtle },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isCompleted ? c.tealDim : c.surface,
                borderColor: isCompleted ? c.teal : c.border,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isCompleted ? c.teal : c.muted },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Text style={[styles.metaItem, { color: c.muted }]}>
            ⏱ {item.duration} min
          </Text>
          <Text style={[styles.dot, { color: c.subtle }]}>·</Text>
          <Text style={[styles.metaItem, { color: c.muted }]}>
            🔥 {item.calories} kcal
          </Text>
          <Text style={[styles.dot, { color: c.subtle }]}>·</Text>
          <Text style={[styles.metaItem, { color: c.subtle }]}>
            {item.timeLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    fontSize: 12,
  },
  dot: {
    fontSize: 14,
    lineHeight: 14,
  },
});

/**
 * GoalCard – displays a single goal with progress bar.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Goal } from '../types';
import { useM4Theme } from '../hooks/useM4Theme';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const c = useM4Theme();

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
      <View style={styles.header}>
        <Text style={[styles.label, { color: c.text }]} numberOfLines={2}>
          {goal.label}
        </Text>
        <View style={styles.right}>
          <Text style={[styles.pct, { color: c.teal }]}>{goal.progressPct}%</Text>
          {onEdit && (
            <Pressable
              onPress={() => onEdit(goal)}
              style={({ pressed }) => [
                styles.editBtn,
                {
                  backgroundColor: pressed ? c.tealDim : c.surface,
                  borderColor: c.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Edit goal: ${goal.label}`}
            >
              <Text style={[styles.editText, { color: c.teal }]}>✏️</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Progress bar track */}
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${goal.progressPct}%`,
              backgroundColor: c.teal,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.remaining, { color: c.muted }]}>
          {goal.remainingLabel}
        </Text>
        <Text style={[styles.duration, { color: c.subtle }]}>
          {goal.duration}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  pct: {
    fontSize: 16,
    fontWeight: '800',
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remaining: {
    fontSize: 12,
  },
  duration: {
    fontSize: 11,
    fontWeight: '500',
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { NAV_COLORS as N } from '@/components/navigation/navigation-theme';

import { FitnessIcon, type FitnessIconName } from './FitnessIcon';
import {
  ProfilePressable,
  ProfileProgressBar,
} from './ProfileMotion';

import { useM4Theme } from '../hooks/useM4Theme';
import type { Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
}

function getGoalIcon(goal: Goal): FitnessIconName {
  switch (goal.type) {
    case 'Workouts per week':
      return 'workouts';

    case 'Calories per week':
      return 'flame';

    case 'Workout minutes':
      return 'clock';

    case 'Monthly workouts':
      return 'calendar';

    default:
      return 'goal';
  }
}

function getGoalCategory(goal: Goal) {
  switch (goal.type) {
    case 'Workouts per week':
      return 'WEEKLY ROUTINE';

    case 'Calories per week':
      return 'ENERGY TARGET';

    case 'Workout minutes':
      return 'TRAINING TIME';

    case 'Monthly workouts':
      return 'MONTHLY TARGET';

    default:
      return 'FITNESS GOAL';
  }
}

export function GoalCard({
  goal,
  onEdit,
}: GoalCardProps) {
  const c = useM4Theme();

  const icon = getGoalIcon(goal);

  const percentage = Math.max(
    0,
    Math.min(100, goal.progressPct),
  );

  const complete = percentage >= 100;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.cardBg,
          borderColor: complete
            ? c.teal
            : c.cardBdr,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: complete
                ? c.teal
                : c.tealDim,
            },
          ]}
        >
          <FitnessIcon
            name={complete ? 'check' : icon}
            color={complete ? N.ink : c.teal}
            size={21}
          />
        </View>

        <View style={styles.titleArea}>
          <Text
            style={[
              styles.category,
              {
                color: c.muted,
              },
            ]}
          >
            {getGoalCategory(goal)}
          </Text>

          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: c.text,
              },
            ]}
          >
            {goal.label}
          </Text>
        </View>

        {onEdit && (
          <ProfilePressable
            label={`Edit ${goal.label}`}
            onPress={() => onEdit(goal)}
            style={[
              styles.editButton,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
              },
            ]}
          >
            <FitnessIcon
              name="goal"
              color={c.muted}
              size={17}
            />
          </ProfilePressable>
        )}
      </View>

      <View style={styles.progressHeading}>
        <View>
          <Text
            style={[
              styles.progressLabel,
              {
                color: c.subtle,
              },
            ]}
          >
            PROGRESS
          </Text>

          <Text
            style={[
              styles.currentValue,
              {
                color: c.text,
              },
            ]}
          >
            {goal.currentValue.toLocaleString()}
            <Text
              style={[
                styles.targetValue,
                {
                  color: c.muted,
                },
              ]}
            >
              {' '}
              / {goal.targetValue.toLocaleString()} {goal.unit}
            </Text>
          </Text>
        </View>

        <Text
          style={[
            styles.percentage,
            {
              color: complete
                ? c.teal
                : c.text,
            },
          ]}
        >
          {percentage}%
        </Text>
      </View>

      <ProfileProgressBar
        value={percentage}
        color={c.teal}
        trackColor={c.border}
        label={`${goal.label} progress`}
      />

      <View style={styles.footer}>
        <View style={styles.remainingRow}>
          <FitnessIcon
            name={complete ? 'check' : 'activity'}
            color={complete ? c.teal : c.muted}
            size={14}
          />

          <Text
            numberOfLines={1}
            style={[
              styles.remaining,
              {
                color: complete
                  ? c.teal
                  : c.muted,
              },
            ]}
          >
            {goal.remainingLabel}
          </Text>
        </View>

        <View
          style={[
            styles.durationPill,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
            },
          ]}
        >
          <Text
            style={[
              styles.duration,
              {
                color: c.muted,
              },
            ]}
          >
            {goal.duration}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  iconTile: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleArea: {
    flex: 1,
  },

  category: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 3,
  },

  title: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },

  editButton: {
    width: 37,
    height: 37,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressHeading: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },

  progressLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  currentValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
  },

  targetValue: {
    fontSize: 11,
    fontWeight: '500',
  },

  percentage: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  footer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  remainingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  remaining: {
    flex: 1,
    fontSize: 10,
  },

  durationPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  duration: {
    fontSize: 9,
    fontWeight: '700',
  },
});
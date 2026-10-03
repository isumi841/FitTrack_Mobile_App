/**
 * ReminderCard – displays a single workout reminder entry.
 */
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { WorkoutReminder } from '../types';
import { useM4Theme } from '../hooks/useM4Theme';

interface ReminderCardProps {
  reminder: WorkoutReminder;
  onToggle: (id: string, enabled: boolean) => void;
}

function formatTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

export function ReminderCard({ reminder, onToggle }: ReminderCardProps) {
  const c = useM4Theme();

  const daysLabel =
    reminder.activeDays.length === 7
      ? 'Daily'
      : reminder.activeDays.join('/');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.cardBg,
          borderColor: reminder.isEnabled ? c.borderH : c.cardBdr,
          shadowColor: c.teal,
        },
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.label, { color: c.text }]}>{reminder.label}</Text>
        <Text style={[styles.time, { color: c.teal }]}>
          {formatTime(reminder.timeHour, reminder.timeMinute)}
          {', '}
          <Text style={[styles.days, { color: c.muted }]}>{daysLabel}</Text>
        </Text>
      </View>
      <Switch
        value={reminder.isEnabled}
        onValueChange={(val) => onToggle(reminder.id, val)}
        trackColor={{ false: c.border, true: c.teal }}
        thumbColor="#fff"
        accessibilityLabel={`${reminder.label} reminder ${reminder.isEnabled ? 'on' : 'off'}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
  },
  days: {
    fontWeight: '400',
    fontSize: 13,
  },
});

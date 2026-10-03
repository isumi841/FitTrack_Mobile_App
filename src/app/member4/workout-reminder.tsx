/**
 * Workout Reminder Screen – Member 4.
 * Route: /member4/workout-reminder
 * Next-level dark fitness UI redesign.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Member4Header } from '@/features/member4/components/Member4Header';
import { ReminderCard } from '@/features/member4/components/ReminderCard';
import { TimePickerModal } from '@/features/member4/components/TimePickerModal';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';
import { mockReminders } from '@/features/member4/data/mockData';
import type { WeekDay, WorkoutReminder } from '@/features/member4/types';

const ALL_DAYS: WeekDay[] = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'];

function formatTime(h: number, m: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function WorkoutReminderScreen() {
  const c = useM4Theme();

  const [reminders, setReminders] = useState<WorkoutReminder[]>(mockReminders);
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [timeHour, setTimeHour] = useState(7);
  const [timeMinute, setTimeMinute] = useState(0);
  const [activeDays, setActiveDays] = useState<WeekDay[]>(['M', 'T', 'W', 'Th', 'F']);
  const [message, setMessage] = useState("Time for your 15-minute workout!");
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  function toggleDay(day: WeekDay) {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleReminderToggle(id: string, enabled: boolean) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEnabled: enabled } : r)),
    );
  }

  function handleSave() {
    if (activeDays.length === 0) {
      Alert.alert('No days selected', 'Please select at least one day for the reminder.');
      return;
    }
    const newReminder: WorkoutReminder = {
      id: `r${Date.now()}`,
      label: 'My Reminder',
      timeHour,
      timeMinute,
      activeDays,
      message,
      isEnabled: dailyEnabled,
    };
    setReminders((prev) => {
      const filtered = prev.filter((r) => r.id !== 'draft');
      return [...filtered, newReminder];
    });
    Alert.alert('Saved!', 'Your reminder has been saved.');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <Member4Header title="Workout Reminder" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Daily Reminder Toggle ── */}
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleIcon}>🔔</Text>
                <View>
                  <Text style={[styles.cardTitle, { color: c.text }]}>Daily Reminder</Text>
                  <Text style={[styles.cardSub, { color: c.muted }]}>
                    Get notified to work out
                  </Text>
                </View>
              </View>
              <Switch
                value={dailyEnabled}
                onValueChange={setDailyEnabled}
                trackColor={{ false: c.border, true: c.teal }}
                thumbColor="#fff"
                accessibilityLabel="Daily reminder toggle"
              />
            </View>
          </View>

          {/* ── Reminder Time ── */}
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.fieldLabel, { color: c.muted }]}>Reminder Time</Text>
            <Pressable
              onPress={() => setTimePickerVisible(true)}
              style={({ pressed }) => [
                styles.timeButton,
                {
                  backgroundColor: pressed ? c.tealDim : c.surface,
                  borderColor: c.teal,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Set reminder time, currently ${formatTime(timeHour, timeMinute)}`}
            >
              <Text style={[styles.timeIcon]}>⏰</Text>
              <Text style={[styles.timeText, { color: c.teal }]}>
                {formatTime(timeHour, timeMinute)}
              </Text>
              <Text style={[styles.timeChevron, { color: c.muted }]}>›</Text>
            </Pressable>
          </View>

          {/* ── Repeat Days ── */}
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.fieldLabel, { color: c.muted }]}>Repeat Days</Text>
            <View style={styles.daysRow}>
              {ALL_DAYS.map((day) => {
                const selected = activeDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: selected ? c.teal : c.surface,
                        borderColor: selected ? c.teal : c.border,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${day}, ${selected ? 'selected' : 'not selected'}`}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        { color: selected ? '#0D1117' : c.muted },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Reminder Message ── */}
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.fieldLabel, { color: c.muted }]}>Reminder Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              style={[
                styles.messageInput,
                {
                  color: c.text,
                  backgroundColor: c.surface,
                  borderColor: c.border,
                },
              ]}
              multiline
              maxLength={140}
              placeholder="Enter your reminder message..."
              placeholderTextColor={c.subtle}
              accessibilityLabel="Reminder message"
            />
            <Text style={[styles.charCount, { color: c.subtle }]}>
              {message.length}/140
            </Text>
          </View>

          {/* ── Save Button ── */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: pressed ? c.tealDim : c.teal,
                shadowColor: c.teal,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save reminder"
          >
            <Text style={[styles.saveBtnText, { color: '#0D1117' }]}>💾 Save Reminder</Text>
          </Pressable>

          {/* ── Existing Reminders ── */}
          {reminders.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Your Reminders</Text>
              {reminders.map((r) => (
                <ReminderCard key={r.id} reminder={r} onToggle={handleReminderToggle} />
              ))}
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <TimePickerModal
        visible={timePickerVisible}
        initialHour={timeHour}
        initialMinute={timeMinute}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(h, m) => {
          setTimeHour(h);
          setTimeMinute(m);
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 3 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleIcon: { fontSize: 24 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  timeIcon: { fontSize: 20 },
  timeText: { fontSize: 22, fontWeight: '800', flex: 1, textAlign: 'center' },
  timeChevron: { fontSize: 24 },

  daysRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: { fontSize: 12, fontWeight: '800' },

  messageInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: -8 },

  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  saveBtnText: { fontSize: 16, fontWeight: '800' },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
});

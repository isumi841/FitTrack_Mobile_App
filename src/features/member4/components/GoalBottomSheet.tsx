/**
 * GoalBottomSheet – modal bottom sheet for adding/editing goals.
 * Uses React Native Modal (no third-party library).
 */
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { Goal, GoalDuration, GoalType } from '../types';
import { useM4Theme } from '../hooks/useM4Theme';

const GOAL_TYPES: GoalType[] = [
  'Workouts per week',
  'Calories per week',
  'Workout minutes',
  'Monthly workouts',
];

const DURATIONS: GoalDuration[] = ['Weekly', 'Monthly'];

const UNIT_MAP: Record<GoalType, string> = {
  'Workouts per week': 'workouts',
  'Calories per week': 'kcal',
  'Workout minutes': 'min',
  'Monthly workouts': 'workouts',
};

interface GoalBottomSheetProps {
  visible: boolean;
  editGoal?: Goal | null;
  onClose: () => void;
  onSave: (type: GoalType, targetValue: number, duration: GoalDuration) => void;
}

export function GoalBottomSheet({
  visible,
  editGoal,
  onClose,
  onSave,
}: GoalBottomSheetProps) {
  const c = useM4Theme();

  const [selectedType, setSelectedType] = useState<GoalType>('Workouts per week');
  const [targetValue, setTargetValue] = useState(5);
  const [duration, setDuration] = useState<GoalDuration>('Weekly');

  useEffect(() => {
    if (editGoal) {
      setSelectedType(editGoal.type);
      setTargetValue(editGoal.targetValue);
      setDuration(editGoal.duration);
    } else {
      setSelectedType('Workouts per week');
      setTargetValue(5);
      setDuration('Weekly');
    }
  }, [editGoal, visible]);

  function handleSave() {
    onSave(selectedType, targetValue, duration);
    onClose();
  }

  function decrement() {
    setTargetValue((v) => Math.max(1, v - 1));
  }

  function increment() {
    setTargetValue((v) => Math.min(999, v + 1));
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: c.overlay }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { backgroundColor: c.bg2, borderColor: c.border }]}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: c.border }]} />

          <Text style={[styles.title, { color: c.text }]}>
            {editGoal ? 'Edit Goal' : 'Set Your Goal'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Goal Type */}
            <Text style={[styles.sectionLabel, { color: c.muted }]}>Goal Type</Text>
            {GOAL_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={({ pressed }) => [
                  styles.optionRow,
                  {
                    backgroundColor:
                      selectedType === type
                        ? c.tealDim
                        : pressed
                        ? c.surface
                        : 'transparent',
                    borderColor: selectedType === type ? c.teal : c.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedType === type }}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: selectedType === type ? c.teal : c.muted,
                      backgroundColor: selectedType === type ? c.teal : 'transparent',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.optionText,
                    { color: selectedType === type ? c.teal : c.text },
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}

            {/* Target Value */}
            <Text style={[styles.sectionLabel, { color: c.muted }]}>Target Value</Text>
            <View style={[styles.stepper, { borderColor: c.border, backgroundColor: c.surface }]}>
              <Pressable
                onPress={decrement}
                style={({ pressed }) => [
                  styles.stepBtn,
                  { backgroundColor: pressed ? c.tealDim : 'transparent' },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Decrease value"
              >
                <Text style={[styles.stepBtnText, { color: c.teal }]}>−</Text>
              </Pressable>

              <View style={styles.stepValue}>
                <Text style={[styles.stepNum, { color: c.text }]}>{targetValue}</Text>
                <Text style={[styles.stepUnit, { color: c.muted }]}>
                  {UNIT_MAP[selectedType]}
                </Text>
              </View>

              <Pressable
                onPress={increment}
                style={({ pressed }) => [
                  styles.stepBtn,
                  { backgroundColor: pressed ? c.tealDim : 'transparent' },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Increase value"
              >
                <Text style={[styles.stepBtnText, { color: c.teal }]}>+</Text>
              </Pressable>
            </View>

            {/* Duration */}
            <Text style={[styles.sectionLabel, { color: c.muted }]}>Duration</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDuration(d)}
                  style={[
                    styles.durationChip,
                    {
                      backgroundColor: duration === d ? c.teal : c.surface,
                      borderColor: duration === d ? c.teal : c.border,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: duration === d }}
                >
                  <Text
                    style={[
                      styles.durationText,
                      { color: duration === d ? '#fff' : c.muted },
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Save */}
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
              accessibilityLabel="Save goal"
            >
              <Text style={styles.saveBtnText}>Save Goal</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelText, { color: c.muted }]}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 52,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 30,
  },
  stepValue: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  stepNum: {
    fontSize: 24,
    fontWeight: '800',
  },
  stepUnit: {
    fontSize: 11,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

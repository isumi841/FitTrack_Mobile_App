/**
 * My Goals Screen – Member 4.
 * Route: /member4/goals
 * Next-level dark fitness UI redesign.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoalCard } from '@/features/member4/components/GoalCard';
import { GoalBottomSheet } from '@/features/member4/components/GoalBottomSheet';
import { Member4Header } from '@/features/member4/components/Member4Header';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';
import { mockGoals, mockProgressStats } from '@/features/member4/data/mockData';
import type { Goal, GoalDuration, GoalType } from '@/features/member4/types';

export default function GoalsScreen() {
  const c = useM4Theme();
  const stats = mockProgressStats;
  const { create } = useLocalSearchParams<{ create?: string }>();

  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (create !== '1') return;

    setEditGoal(null);
    setSheetVisible(true);
    // Consume the action so returning here does not reopen the sheet, and the
    // shared dock can request another goal while this screen stays mounted.
    router.setParams({ create: undefined });
  }, [create]);

  function handleAddGoal() {
    setEditGoal(null);
    setSheetVisible(true);
  }

  function handleEditGoal(goal: Goal) {
    setEditGoal(goal);
    setSheetVisible(true);
  }

  function handleSaveGoal(type: GoalType, targetValue: number, duration: GoalDuration) {
    if (editGoal) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === editGoal.id
            ? {
                ...g,
                type,
                targetValue,
                duration,
                label: `${type === 'Workouts per week' ? 'Work out' : type} – ${targetValue}`,
                progressPct: Math.round((g.currentValue / targetValue) * 100),
              }
            : g,
        ),
      );
    } else {
      const unitMap: Record<GoalType, string> = {
        'Workouts per week': 'workouts',
        'Calories per week': 'kcal',
        'Workout minutes': 'min',
        'Monthly workouts': 'workouts',
      };
      const labelMap: Record<GoalType, (v: number) => string> = {
        'Workouts per week': (v) => `Work out ${v} days a week`,
        'Calories per week': (v) => `Burn ${v} calories weekly`,
        'Workout minutes': (v) => `Train ${v} minutes per session`,
        'Monthly workouts': (v) => `Complete ${v} workouts this month`,
      };

      const newGoal: Goal = {
        id: `g${Date.now()}`,
        type,
        label: labelMap[type](targetValue),
        targetValue,
        currentValue: 0,
        unit: unitMap[type],
        duration,
        progressPct: 0,
        remainingLabel: `0 of ${targetValue} ${unitMap[type]}`,
      };
      setGoals((prev) => [...prev, newGoal]);
    }
  }

  const weeklyPct = Math.round(
    (stats.workoutsCompleted / stats.workoutsTarget) * 100,
  );

  const completedGoals = goals.filter((g) => g.progressPct >= 100).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <Member4Header
        title="My Goals"
        rightElement={
          <Pressable
            onPress={handleAddGoal}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: pressed ? c.tealDim : c.teal },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add new goal"
          >
            <Text style={[styles.addBtnText, { color: '#0D1117' }]}>+</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Weekly Summary Banner ── */}
        <View style={[styles.bannerCard, { backgroundColor: c.teal }]}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerLabel}>WEEKLY GOAL</Text>
            <Text style={styles.bannerValue}>
              {stats.workoutsCompleted}/{stats.workoutsTarget} workouts
            </Text>
            <Text style={styles.bannerSub}>completed this week</Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.bannerPct}>{weeklyPct}%</Text>
            <Pressable
              onPress={handleAddGoal}
              style={[styles.editGoalBtn, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
              accessibilityRole="button"
              accessibilityLabel="Edit weekly goal"
            >
              <Text style={styles.editGoalBtnText}>Edit Goal</Text>
            </Pressable>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.weeklyBar, { backgroundColor: c.border }]}>
          <View
            style={[
              styles.weeklyFill,
              { width: `${weeklyPct}%`, backgroundColor: c.teal },
            ]}
          />
        </View>

        {/* ── Goal Stats ── */}
        <View style={styles.goalStatsRow}>
          <View style={[styles.goalStat, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.goalStatNum, { color: c.teal }]}>{goals.length}</Text>
            <Text style={[styles.goalStatLabel, { color: c.muted }]}>Active</Text>
          </View>
          <View style={[styles.goalStat, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.goalStatNum, { color: c.text }]}>{completedGoals}</Text>
            <Text style={[styles.goalStatLabel, { color: c.muted }]}>Done</Text>
          </View>
          <View style={[styles.goalStat, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.goalStatNum, { color: c.teal }]}>{weeklyPct}%</Text>
            <Text style={[styles.goalStatLabel, { color: c.muted }]}>Weekly</Text>
          </View>
        </View>

        {/* ── Active Goals ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Active Goals</Text>
          <Text style={[styles.sectionCount, { color: c.muted }]}>{goals.length}</Text>
        </View>

        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} />
        ))}

        {goals.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyText, { color: c.muted }]}>
              No goals yet. Tap + to add your first goal!
            </Text>
          </View>
        )}

        {/* ── Add New Goal CTA ── */}
        <Pressable
          onPress={handleAddGoal}
          style={({ pressed }) => [
            styles.addGoalCta,
            {
              backgroundColor: pressed ? c.tealDim : 'transparent',
              borderColor: c.teal,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add new goal"
        >
          <Text style={[styles.addGoalCtaIcon, { color: c.teal }]}>＋</Text>
          <Text style={[styles.addGoalCtaText, { color: c.teal }]}>Add New Goal</Text>
        </Pressable>

        <View style={{ height: 16 }} />
      </ScrollView>

      <GoalBottomSheet
        visible={sheetVisible}
        editGoal={editGoal}
        onClose={() => setSheetVisible(false)}
        onSave={handleSaveGoal}
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

  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, fontWeight: '300', lineHeight: 26 },

  // Banner
  bannerCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerLeft: { gap: 4, flex: 1 },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
  },
  bannerValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0D1117',
    letterSpacing: -0.3,
  },
  bannerSub: { fontSize: 13, color: 'rgba(0,0,0,0.55)', fontWeight: '500' },
  bannerRight: { alignItems: 'flex-end', gap: 8 },
  bannerPct: { fontSize: 32, fontWeight: '900', color: '#0D1117' },
  editGoalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editGoalBtnText: { fontSize: 12, fontWeight: '700', color: '#0D1117' },

  weeklyBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  weeklyFill: { height: '100%', borderRadius: 3 },

  // Goal stats
  goalStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  goalStat: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  goalStatNum: { fontSize: 20, fontWeight: '800' },
  goalStatLabel: { fontSize: 11, fontWeight: '500' },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 14, textAlign: 'center' },

  addGoalCta: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addGoalCtaIcon: { fontSize: 18, fontWeight: '700' },
  addGoalCtaText: { fontSize: 15, fontWeight: '700' },
});

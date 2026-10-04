/**
 * Progress Dashboard Screen – Member 4.
 * Route: /member4/progress
 * Next-level dark fitness UI redesign.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SimpleProgressRing } from '@/features/member4/components/ProgressRing';
import { StatCard } from '@/features/member4/components/StatCard';
import { WeeklyActivityChart } from '@/features/member4/components/WeeklyActivityChart';
import { WorkoutHistoryCard } from '@/features/member4/components/WorkoutHistoryCard';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';
import {
  mockProgressStats,
  mockRecentWorkouts,
  mockWeeklyBars,
} from '@/features/member4/data/mockData';
import type { DailyActivityBar } from '@/features/member4/types';

export default function ProgressScreen() {
  const c = useM4Theme();
  const stats = mockProgressStats;

  const [selectedBarIdx, setSelectedBarIdx] = useState(
    mockWeeklyBars.findIndex((b) => b.isSelected),
  );
  const [selectedBar, setSelectedBar] = useState<DailyActivityBar | null>(
    mockWeeklyBars.find((b) => b.isSelected) ?? null,
  );

  function handleBarPress(bar: DailyActivityBar, idx: number) {
    setSelectedBarIdx(idx);
    setSelectedBar(bar);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerGreeting, { color: c.muted }]}>Good Morning 👋</Text>
          <Text style={[styles.headerName, { color: c.text }]}>Nimal</Text>
        </View>
        <Pressable
          onPress={() => router.push('/member4/profile')}
          style={({ pressed }) => [
            styles.avatarBtn,
            {
              backgroundColor: pressed ? c.tealDim : c.cardBg,
              borderColor: c.teal,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Profile settings"
        >
          <Text style={styles.avatarText}>N</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Streak Card ── */}
        <View style={[styles.heroCard, { backgroundColor: c.teal }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>CURRENT STREAK</Text>
            <Text style={styles.heroStreak}>{stats.streakDays} Days 🔥</Text>
            <Text style={styles.heroSub}>Keep it up — you’re on fire!</Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
            <Text style={styles.heroBadgeIcon}>🏅</Text>
          </View>
        </View>

        {/* ── 4 Stat Cards ── */}
        <View style={styles.statsRow}>
          <StatCard
            label="Workouts"
            value={`${stats.workoutsCompleted}/${stats.workoutsTarget}`}
            sub={`${stats.weeklyCompletionPct}% done`}
            emoji="💪"
            accent
          />
          <StatCard
            label="Minutes"
            value={`${stats.totalMinutes}`}
            sub={`Target: ${stats.targetMinutes}`}
            emoji="⏱"
          />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard
            label="Calories"
            value={`${stats.caloriesBurned}`}
            sub="kcal burned"
            emoji="🔥"
          />
          <StatCard
            label="Best Week"
            value="8h 45m"
            sub="Total time"
            emoji="⭐"
            accent
          />
        </View>

        {/* ── Weekly Completion Ring ── */}
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Weekly Completion</Text>
            <View style={[styles.badge, { backgroundColor: c.tealDim }]}>
              <Text style={[styles.badgeText, { color: c.teal }]}>This Week</Text>
            </View>
          </View>
          <View style={styles.ringRow}>
            <SimpleProgressRing
              percentage={stats.weeklyCompletionPct}
              size={160}
              strokeWidth={14}
              label="Completed"
              sublabel={`${stats.workoutsCompleted} of ${stats.workoutsTarget} workouts`}
            />
            <View style={styles.ringMeta}>
              <View style={styles.ringMetaItem}>
                <Text style={[styles.ringMetaValue, { color: c.teal }]}>
                  {stats.workoutsCompleted}
                </Text>
                <Text style={[styles.ringMetaLabel, { color: c.muted }]}>Done</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <View style={styles.ringMetaItem}>
                <Text style={[styles.ringMetaValue, { color: c.text }]}>
                  {stats.workoutsTarget - stats.workoutsCompleted}
                </Text>
                <Text style={[styles.ringMetaLabel, { color: c.muted }]}>Left</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <View style={styles.ringMetaItem}>
                <Text style={[styles.ringMetaValue, { color: c.teal }]}>
                  {stats.streakDays}
                </Text>
                <Text style={[styles.ringMetaLabel, { color: c.muted }]}>Streak</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Weekly Activity Chart ── */}
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Workout Summary</Text>
            <Pressable
              onPress={() => router.push('/member4/progress-details')}
              accessibilityRole="button"
              accessibilityLabel="View progress details"
            >
              <Text style={[styles.viewDetails, { color: c.teal }]}>Details →</Text>
            </Pressable>
          </View>

          {/* Period row */}
          <View style={styles.periodRow}>
            {['Week', 'Month', 'Year'].map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.periodChip,
                  p === 'Week' && { backgroundColor: c.teal },
                  p !== 'Week' && { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    { color: p === 'Week' ? '#0D1117' : c.muted },
                  ]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>

          {selectedBar && selectedBar.minutes > 0 && (
            <View style={[styles.tooltip, { backgroundColor: c.tealDim, borderColor: c.teal }]}>
              <Text style={[styles.tooltipText, { color: c.teal }]}>
                {selectedBar.day} · {selectedBar.minutes} min
                {selectedBar.workout ? ` · ${selectedBar.workout}` : ''}
              </Text>
            </View>
          )}

          <WeeklyActivityChart
            bars={mockWeeklyBars}
            selectedIndex={selectedBarIdx}
            onBarPress={handleBarPress}
            maxHeight={90}
          />

          {/* Summary row */}
          <View style={styles.chartSummaryRow}>
            <View style={styles.chartSumItem}>
              <Text style={[styles.chartSumValue, { color: c.text }]}>12</Text>
              <Text style={[styles.chartSumLabel, { color: c.muted }]}>Workouts</Text>
            </View>
            <View style={[styles.chartSumDivider, { backgroundColor: c.border }]} />
            <View style={styles.chartSumItem}>
              <Text style={[styles.chartSumValue, { color: c.text }]}>8h 45m</Text>
              <Text style={[styles.chartSumLabel, { color: c.muted }]}>Total Time</Text>
            </View>
            <View style={[styles.chartSumDivider, { backgroundColor: c.border }]} />
            <View style={styles.chartSumItem}>
              <Text style={[styles.chartSumValue, { color: c.teal }]}>3,250</Text>
              <Text style={[styles.chartSumLabel, { color: c.muted }]}>Calories</Text>
            </View>
          </View>
        </View>

        {/* ── Recent Workouts ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Workouts</Text>
            <Pressable
              onPress={() => router.push('/member4/workout-history')}
              accessibilityRole="button"
              accessibilityLabel="View all workout history"
            >
              <Text style={[styles.viewDetails, { color: c.teal }]}>See All →</Text>
            </Pressable>
          </View>

          {mockRecentWorkouts.map((w) => (
            <WorkoutHistoryCard key={w.id} item={w} />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingTop: Platform.OS === 'web' ? 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { gap: 2 },
  headerGreeting: { fontSize: 13, fontWeight: '500' },
  headerName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#C6F135',
    fontSize: 18,
    fontWeight: '800',
  },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  // Hero streak card
  heroCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLeft: { gap: 4, flex: 1 },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(0,0,0,0.6)',
    textTransform: 'uppercase',
  },
  heroStreak: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0D1117',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
    fontWeight: '500',
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeIcon: { fontSize: 28 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },

  // Card
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  viewDetails: { fontSize: 13, fontWeight: '600' },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Period chips
  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  periodChipText: { fontSize: 12, fontWeight: '700' },

  // Ring
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ringMeta: { flex: 1, gap: 14 },
  ringMetaItem: { alignItems: 'center', gap: 2 },
  ringMetaValue: { fontSize: 22, fontWeight: '800' },
  ringMetaLabel: { fontSize: 11, fontWeight: '500' },
  divider: { height: 1, width: '70%', alignSelf: 'center' },

  // Chart summary
  chartSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  chartSumItem: { flex: 1, alignItems: 'center', gap: 2 },
  chartSumValue: { fontSize: 14, fontWeight: '800' },
  chartSumLabel: { fontSize: 10, fontWeight: '500' },
  chartSumDivider: { width: 1, height: 28 },

  // Tooltip
  tooltip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  tooltipText: { fontSize: 12, fontWeight: '600' },

  // Sections
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },

});

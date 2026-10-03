/**
 * Progress Details Screen – Member 4.
 * Route: /member4/progress-details
 * Next-level dark fitness UI redesign.
 */
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Member4Header } from '@/features/member4/components/Member4Header';
import { WeeklyActivityChart } from '@/features/member4/components/WeeklyActivityChart';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';
import {
  mockMonthData,
  mockWeekData,
  mockYearData,
} from '@/features/member4/data/mockData';
import type { DailyActivityBar, ProgressPeriodData } from '@/features/member4/types';

type Period = 'Week' | 'Month' | 'Year';

const DATA_MAP: Record<Period, ProgressPeriodData> = {
  Week: mockWeekData,
  Month: mockMonthData,
  Year: mockYearData,
};

export default function ProgressDetailsScreen() {
  const c = useM4Theme();

  const [period, setPeriod] = useState<Period>('Week');
  const [selectedIdx, setSelectedIdx] = useState(
    () => mockWeekData.bars.findIndex((b) => b.isSelected),
  );
  const [selectedBar, setSelectedBar] = useState<DailyActivityBar | null>(
    mockWeekData.bars.find((b) => b.isSelected) ?? null,
  );

  const data = DATA_MAP[period];

  function handlePeriod(p: Period) {
    setPeriod(p);
    const defaultIdx = DATA_MAP[p].bars.findIndex((b) => b.isSelected);
    setSelectedIdx(defaultIdx >= 0 ? defaultIdx : 0);
    setSelectedBar(DATA_MAP[p].bars[defaultIdx >= 0 ? defaultIdx : 0] ?? null);
  }

  function handleBarPress(bar: DailyActivityBar, idx: number) {
    setSelectedIdx(idx);
    setSelectedBar(bar);
  }

  const PERIODS: Period[] = ['Week', 'Month', 'Year'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <Member4Header title="Progress Details" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Segment Control ── */}
        <View style={[styles.segmentContainer, { backgroundColor: c.surface, borderColor: c.border }]}>
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => handlePeriod(p)}
              style={[
                styles.segment,
                period === p && { backgroundColor: c.teal },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: period === p }}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: period === p ? '#0D1117' : c.muted },
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── 3 Summary Stats ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: c.cardBg, borderColor: c.teal, borderWidth: 1.5 }]}>
            <Text style={[styles.summaryValue, { color: c.teal }]}>
              {data.avgSession} min
            </Text>
            <Text style={[styles.summaryLabel, { color: c.muted }]}>Avg Session</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.summaryValue, { color: c.text }]}>
              {data.bestDay}
            </Text>
            <Text style={[styles.summaryLabel, { color: c.muted }]}>Best Day</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: c.cardBg, borderColor: c.teal, borderWidth: 1.5 }]}>
            <Text style={[styles.summaryValue, { color: c.teal }]}>
              {data.consistencyPct}%
            </Text>
            <Text style={[styles.summaryLabel, { color: c.muted }]}>Consistency</Text>
          </View>
        </View>

        {/* ── Chart Card ── */}
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>
            {period === 'Week'
              ? 'Minutes per Day'
              : period === 'Month'
              ? 'Minutes per Week'
              : 'Minutes per Month'}
          </Text>

          {selectedBar && selectedBar.minutes > 0 && (
            <View style={[styles.tooltip, { backgroundColor: c.tealDim, borderColor: c.teal }]}>
              <Text style={[styles.tooltipMain, { color: c.teal }]}>
                {selectedBar.day} — {selectedBar.minutes} min
              </Text>
              {selectedBar.workout && (
                <Text style={[styles.tooltipSub, { color: c.muted }]}>
                  {selectedBar.workout}
                </Text>
              )}
            </View>
          )}

          <WeeklyActivityChart
            bars={data.bars}
            selectedIndex={selectedIdx}
            onBarPress={handleBarPress}
            maxHeight={120}
          />
        </View>

        {/* ── Breakdown list ── */}
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Daily Breakdown</Text>
          {data.bars.map((bar, i) => {
            const isSelected = i === selectedIdx;
            const maxMinutes = Math.max(...data.bars.map((b) => b.minutes), 1);
            const pct = bar.minutes > 0 ? (bar.minutes / maxMinutes) * 100 : 0;
            return (
              <Pressable
                key={i}
                onPress={() => handleBarPress(bar, i)}
                style={[
                  styles.breakdownRow,
                  isSelected && { backgroundColor: c.tealDim, borderRadius: 12 },
                ]}
              >
                <Text
                  style={[
                    styles.breakdownDay,
                    { color: isSelected ? c.teal : c.muted },
                  ]}
                >
                  {bar.day}
                </Text>
                <View style={[styles.breakdownTrack, { backgroundColor: c.border }]}>
                  <View
                    style={[
                      styles.breakdownFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: isSelected ? c.teal : c.tealDim,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.breakdownMin, { color: isSelected ? c.teal : c.text }]}>
                  {bar.minutes > 0 ? `${bar.minutes}m` : '—'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
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
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  // Segment
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '700' },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  // Card
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },

  // Tooltip
  tooltip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    gap: 2,
  },
  tooltipMain: { fontSize: 14, fontWeight: '700' },
  tooltipSub: { fontSize: 12 },

  // Breakdown
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  breakdownDay: { width: 34, fontSize: 12, fontWeight: '700' },
  breakdownTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownFill: { height: '100%', borderRadius: 4 },
  breakdownMin: { width: 32, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});

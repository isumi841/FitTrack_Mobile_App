import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Member4Avatar,
} from '@/features/member4/components/Member4Avatar';

import { NAV_COLORS as N } from '@/components/navigation/navigation-theme';
import { FitnessIcon, type FitnessIconName } from '@/features/member4/components/FitnessIcon';
import { M4Screen } from '@/features/member4/components/M4Screen';
import {
  ProfilePressable,
  ProfileProgressBar,
  ProfileReveal,
} from '@/features/member4/components/ProfileMotion';
import { DashboardChart, DashboardRing } from '@/features/member4/components/ProgressVisuals';

import {
  DEMO_AS_OF,
  PERIOD_OPTIONS,
  getChangePercent,
  getDashboardSummary,
  getMetricBars,
  type Category,
  type Metric,
  type Period,
} from '@/features/member4/data/progressDashboard';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';

const METRICS: { value: Metric; label: string; unit: string; icon: FitnessIconName }[] = [
  { value: 'minutes', label: 'Minutes', unit: 'min', icon: 'clock' },
  { value: 'workouts', label: 'Workouts', unit: 'sessions', icon: 'workouts' },
  { value: 'calories', label: 'Calories', unit: 'kcal', icon: 'flame' },
];

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'mobility', label: 'Mobility' },
];

/** The dashboard and its controls share a single, explicitly dated demo report. */
export default function ProgressScreen() {
  const c = useM4Theme();
  const [period, setPeriod] = useState<Period>('week');
  const [metric, setMetric] = useState<Metric>('minutes');
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(DEMO_AS_OF);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [visibleSessions, setVisibleSessions] = useState(3);
  const [aboutOpen, setAboutOpen] = useState(false);

  const summary = useMemo(() => getDashboardSummary(period), [period]);
  const bars = useMemo(() => getMetricBars(summary, metric), [summary, metric]);
  const metricConfig = METRICS.find((item) => item.value === metric)!;
  const selectedBar = bars.find((bar) => bar.id === selectedBarId)
    ?? bars.findLast((bar) => bar.value > 0)
    ?? bars[0];
  const selectedCalendarDay = summary.calendar.find((day) => day.date === selectedDay)
    ?? summary.calendar[summary.calendar.length - 1];
  const filteredSessions = summary.sessions.filter(
    (session) => category === 'all' || session.category === category,
  );
  const displayedSessions = filteredSessions.slice(0, visibleSessions);
  const remainingSessions = Math.max(0, filteredSessions.length - visibleSessions);
  const completion = summary.target.workouts > 0
    ? Math.min(100, Math.round(summary.totals.workouts / summary.target.workouts * 100))
    : 0;
  const remainingWorkouts = Math.max(0, summary.target.workouts - summary.totals.workouts);
  const activeCalendarDays = summary.calendar.filter((day) => day.workouts > 0).length;
  const minutesChange = summary.hasPreviousData
    ? getChangePercent(summary.totals.minutes, summary.previousTotals.minutes)
    : null;
  const workoutChange = summary.totals.workouts - summary.previousTotals.workouts;
  const longestSession = summary.sessions.reduce<(typeof summary.sessions)[number] | undefined>(
    (best, session) => !best || session.minutes > best.minutes ? session : best,
    undefined,
  );
  const leadingCategory = summary.categories.reduce<(typeof summary.categories)[number] | undefined>(
    (best, item) => !best || item.minutes > best.minutes ? item : best,
    undefined,
  );

  function selectPeriod(next: Period) {
    setPeriod(next);
    setSelectedBarId(null);
    setCategory('all');
    setExpandedSessionId(null);
    setVisibleSessions(3);
  }

  function selectCategory(next: Category | 'all') {
    setCategory(next);
    setExpandedSessionId(null);
    setVisibleSessions(3);
  }

  return (
    <M4Screen>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.headerCopy}>
          <Text style={[styles.brand, { color: c.muted }]}>FITTRACK / YOUR JOURNEY</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>
            Your progress.
          </Text>
        </View>
        <ProfilePressable
          label="Open profile"
          testID="progress-profile"
          onPress={() =>
            router.push('/member4/profile')
          }
          style={styles.avatar}
        >
          <Member4Avatar
            size={46}
          />

          <View
            style={[
              styles.avatarDot,
              {
                backgroundColor: c.teal,
                borderColor: c.bg,
              },
            ]}
          />
        </ProfilePressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID="progress-dashboard"
      >
        <ProfileReveal>
          <View style={styles.reportHeading}>
            <View style={styles.rangeCopy}>
              <FitnessIcon name="calendar" color={c.muted} size={16} />
              <Text style={[styles.rangeText, { color: c.muted }]}>{summary.rangeLabel}</Text>
            </View>
            <View style={[styles.demoPill, { backgroundColor: c.tealDim }]}>
              <View style={[styles.tinyDot, { backgroundColor: c.teal }]} />
              <Text style={[styles.demoText, { color: c.teal }]}>Demo data</Text>
            </View>
          </View>
          <View
            accessibilityRole="tablist"
            accessibilityLabel="Report period"
            style={[styles.periodControl, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}
          >
            {PERIOD_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityLabel={`${option.label} report`}
                accessibilityState={{ selected: period === option.value }}
                testID={`progress-period-${option.value}`}
                onPress={() => selectPeriod(option.value)}
                style={({ pressed }) => [
                  styles.periodButton,
                  period === option.value && styles.periodSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[
                  styles.periodLabel,
                  { color: period === option.value ? N.ink : c.muted },
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ProfileReveal>

        <ProfileReveal delay={45}>
          <View style={styles.hero}>
            <View pointerEvents="none" style={styles.heroOrbit} />
            <View style={styles.heroTop}>
              <Text style={styles.heroEyebrow}>EVERY SESSION COUNTS</Text>
              <FitnessIcon name="activity" color={N.accent} size={21} />
            </View>
            <View style={styles.heroMain}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Showing up.{ '\n' }Moving forward.</Text>
                <Text style={styles.heroDescription}>
                  {remainingWorkouts === 0
                    ? 'Your workout target is complete. Take a moment to enjoy it.'
                    : `${remainingWorkouts} more ${remainingWorkouts === 1 ? 'session' : 'sessions'} to reach your ${period === 'week' ? 'weekly' : period === 'month' ? '28-day' : 'year-to-date'} target.`}
                </Text>
              </View>
              <DashboardRing percentage={completion} size={116} label="of target" />
            </View>
            <View style={styles.heroFooter}>
              <View style={styles.heroStat}>
                <Text style={styles.heroValue}>{summary.totals.workouts}</Text>
                <Text style={styles.heroStatLabel}>sessions logged</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroValue}>{summary.target.workouts}</Text>
                <Text style={styles.heroStatLabel}>session target</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroValue}>{summary.activeDays}</Text>
                <Text style={styles.heroStatLabel}>active days</Text>
              </View>
            </View>
          </View>
        </ProfileReveal>

        <ProfileReveal delay={85}>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
              <View style={styles.metricHeading}>
                <View style={[styles.iconTileSmall, { backgroundColor: c.tealDim }]}>
                  <FitnessIcon name="clock" color={c.teal} size={19} />
                </View>
                <Text style={[styles.smallLabel, { color: c.muted }]}>TIME MOVING</Text>
              </View>
              <Text style={[styles.metricValue, { color: c.text }]}>
                {summary.totals.minutes.toLocaleString('en-US')}
                <Text style={[styles.metricUnit, { color: c.muted }]}> min</Text>
              </Text>
              <Text style={[styles.metricDescription, { color: c.muted }]}>
                {summary.averageMinutes} min average session
              </Text>
              <ProfileProgressBar
                value={summary.target.minutes > 0 ? summary.totals.minutes / summary.target.minutes * 100 : 0}
                color={c.teal}
                trackColor={c.tealDim}
                label="Movement time target"
              />
            </View>
            <View style={[styles.metricCard, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
              <View style={styles.metricHeading}>
                <View style={[styles.iconTileSmall, { backgroundColor: c.tealDim }]}>
                  <FitnessIcon name="flame" color={c.teal} size={19} />
                </View>
                <Text style={[styles.smallLabel, { color: c.muted }]}>ENERGY</Text>
              </View>
              <Text style={[styles.metricValue, { color: c.text }]}>
                {summary.totals.calories.toLocaleString('en-US')}
                <Text style={[styles.metricUnit, { color: c.muted }]}> kcal</Text>
              </Text>
              <Text style={[styles.metricDescription, { color: c.muted }]}>Estimated workout energy</Text>
              <ProfileProgressBar
                value={summary.target.calories > 0 ? summary.totals.calories / summary.target.calories * 100 : 0}
                color={c.teal}
                trackColor={c.tealDim}
                label="Workout energy target"
              />
            </View>
          </View>
        </ProfileReveal>

        <ProfileReveal delay={120}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={[styles.eyebrow, { color: c.muted }]}>THE BIGGER PICTURE</Text>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: c.text }]}>Activity overview</Text>
            </View>
            <ProfilePressable
              label="View progress details"
              testID="progress-details"
              onPress={() => router.push('/member4/progress-details')}
              style={[styles.roundButton, { borderColor: c.cardBdr, backgroundColor: c.cardBg }]}
            >
              <FitnessIcon name="arrow-up-right" color={c.teal} size={20} />
            </ProfilePressable>
          </View>
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <View accessibilityRole="tablist" accessibilityLabel="Chart metric" style={styles.metricControl}>
              {METRICS.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="tab"
                  accessibilityLabel={`Chart ${option.label.toLowerCase()}`}
                  accessibilityState={{ selected: metric === option.value }}
                  testID={`progress-metric-${option.value}`}
                  onPress={() => setMetric(option.value)}
                  style={({ pressed }) => [
                    styles.metricButton,
                    { backgroundColor: metric === option.value ? c.tealDim : 'transparent' },
                    pressed && styles.pressed,
                  ]}
                >
                  <FitnessIcon name={option.icon} size={15} color={metric === option.value ? c.teal : c.muted} />
                  <Text style={[styles.metricButtonText, { color: metric === option.value ? c.teal : c.muted }]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.chartTotal}>
              <View style={styles.chartTotalCopy}>
                <Text style={[styles.chartValue, { color: c.text }]}>
                  {summary.totals[metric].toLocaleString('en-US')}
                  <Text style={[styles.chartUnit, { color: c.muted }]}> {metricConfig.unit}</Text>
                </Text>
                <Text style={[styles.bodySmall, { color: c.muted }]}>
                  {period === 'week' ? 'Across the last 7 days' : period === 'month' ? 'Across the last 28 days' : 'From January to the report date'}
                </Text>
              </View>
              <View style={[styles.chartIcon, { backgroundColor: c.tealDim }]}>
                <FitnessIcon name={metricConfig.icon} color={c.teal} size={23} />
              </View>
            </View>
            <DashboardChart
              bars={bars}
              selectedId={selectedBar?.id ?? null}
              onSelect={setSelectedBarId}
              unit={metricConfig.unit}
            />
            <View
              accessibilityLiveRegion="polite"
              style={[styles.chartSelection, { backgroundColor: c.tealDim }]}
            >
              <View style={[styles.selectionDot, { backgroundColor: c.teal }]} />
              <View style={styles.selectionCopy}>
                <Text style={[styles.selectionLabel, { color: c.text }]}>{selectedBar?.fullLabel ?? 'No activity'}</Text>
                <Text style={[styles.selectionHint, { color: c.muted }]}>Tap a bar to explore your activity</Text>
              </View>
              <Text style={[styles.selectionValue, { color: c.teal }]}>
                {selectedBar?.value.toLocaleString('en-US') ?? 0} {metricConfig.unit}
              </Text>
            </View>
            <View style={[styles.comparison, { borderTopColor: c.border }]}>
              <FitnessIcon name="trend-up" color={c.muted} size={18} />
              <Text style={[styles.comparisonText, { color: c.muted }]}>
                {summary.hasPreviousData
                  ? minutesChange === null
                    ? 'Movement logged this period; the previous period had no minutes.'
                    : `${Math.abs(minutesChange)}% ${minutesChange >= 0 ? 'more' : 'less'} movement time ${summary.comparisonLabel.toLowerCase()}.`
                  : 'A previous-year comparison will appear when there is enough history.'}
              </Text>
            </View>
          </View>
        </ProfileReveal>

        <ProfileReveal delay={160}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={[styles.eyebrow, { color: c.muted }]}>A LITTLE, OFTEN</Text>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: c.text }]}>Your consistency</Text>
            </View>
            <Text style={[styles.sectionMeta, { color: c.muted }]}>Last 28 days</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <View style={styles.consistencyHeading}>
              <View style={styles.flexCopy}>
                <Text style={[styles.consistencyValue, { color: c.text }]}>
                  {activeCalendarDays}<Text style={[styles.consistencyUnit, { color: c.muted }]}> / 28 days</Text>
                </Text>
                <Text style={[styles.bodySmall, { color: c.muted }]}>A record of when you made time to move.</Text>
              </View>
              <View style={[styles.iconTile, { backgroundColor: c.tealDim }]}>
                <FitnessIcon name="calendar" color={c.teal} size={24} />
              </View>
            </View>
            <View style={styles.calendarLabels}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
                <Text key={`${label}-${index}`} style={[styles.weekday, { color: c.muted }]}>{label}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {summary.calendar.map((day) => {
                const selected = selectedCalendarDay?.date === day.date;
                return (
                  <Pressable
                    key={day.date}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.label}: ${day.workouts} ${day.workouts === 1 ? 'workout' : 'workouts'}, ${day.minutes} minutes`}
                    accessibilityState={{ selected }}
                    testID={`progress-day-${day.date}`}
                    onPress={() => setSelectedDay(day.date)}
                    style={({ pressed }) => [styles.dayHitArea, pressed && styles.pressed]}
                  >
                    <View style={[
                      styles.dayCell,
                      {
                        backgroundColor: day.workouts > 0 ? c.tealDim : c.bg,
                        borderColor: selected ? c.teal : 'transparent',
                      },
                    ]}>
                      <Text style={[
                        styles.dayNumber,
                        { color: day.workouts > 0 || selected ? c.teal : c.muted },
                        selected && styles.dayNumberSelected,
                      ]}>
                        {Number(day.date.slice(-2))}
                      </Text>
                      <View style={[
                        styles.dayDot,
                        { backgroundColor: day.workouts > 0 ? c.teal : 'transparent' },
                      ]} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSquare, { backgroundColor: c.tealDim, borderColor: c.teal }]} />
                <Text style={[styles.legendText, { color: c.muted }]}>Workout logged</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSquare, { backgroundColor: c.bg, borderColor: c.border }]} />
                <Text style={[styles.legendText, { color: c.muted }]}>No session</Text>
              </View>
            </View>
            <View
              accessibilityLiveRegion="polite"
              style={[styles.selectedDaySummary, { borderTopColor: c.border }]}
            >
              <Text style={[styles.daySummaryTitle, { color: c.text }]}>{selectedCalendarDay?.label}</Text>
              <Text style={[styles.bodySmall, { color: c.muted }]}>
                {selectedCalendarDay?.workouts
                  ? `${selectedCalendarDay.workouts} ${selectedCalendarDay.workouts === 1 ? 'session' : 'sessions'} completed · ${selectedCalendarDay.minutes} minutes moving`
                  : 'No workout logged. Rest days are part of the journey, too.'}
              </Text>
            </View>
          </View>
        </ProfileReveal>

        <ProfileReveal delay={200}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={[styles.eyebrow, { color: c.muted }]}>VARIETY IN YOUR ROUTINE</Text>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: c.text }]}>Training balance</Text>
            </View>
            <Text style={[styles.sectionMeta, { color: c.muted }]}>By time</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            {summary.categories.map((item, index) => (
              <View
                key={item.category}
                style={[
                  styles.categoryRow,
                  index > 0 && [styles.categorySeparator, { borderTopColor: c.border }],
                ]}
              >
                <View style={[styles.iconTile, { backgroundColor: c.tealDim }]}>
                  <FitnessIcon name={item.category} color={c.teal} size={22} />
                </View>
                <View style={styles.categoryContent}>
                  <View style={styles.categoryHeading}>
                    <Text style={[styles.categoryTitle, { color: c.text }]}>{item.label}</Text>
                    <Text style={[styles.categoryPercentage, { color: c.teal }]}>{item.percent}%</Text>
                  </View>
                  <ProfileProgressBar
                    value={item.percent}
                    color={c.teal}
                    trackColor={c.tealDim}
                    label={`${item.label} share of workout time`}
                  />
                  <Text style={[styles.categoryDescription, { color: c.muted }]}>
                    {item.count} {item.count === 1 ? 'session' : 'sessions'} · {item.minutes.toLocaleString('en-US')} minutes
                  </Text>
                </View>
              </View>
            ))}
            <View style={[styles.balanceNote, { backgroundColor: c.bg }]}>
              <FitnessIcon name="info" color={c.muted} size={17} />
              <Text style={[styles.noteText, { color: c.muted }]}>
                {leadingCategory && leadingCategory.minutes > 0
                  ? `${leadingCategory.label} accounts for most of your movement time in this period.`
                  : 'Your training mix will appear here after a session is logged.'}
              </Text>
            </View>
          </View>
        </ProfileReveal>

        <ProfileReveal delay={230}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={[styles.eyebrow, { color: c.muted }]}>WORTH NOTICING</Text>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: c.text }]}>Progress highlights</Text>
            </View>
            <FitnessIcon name="spark" color={c.teal} size={20} />
          </View>
          <View style={styles.highlights}>
            <View style={[styles.highlight, { borderColor: c.cardBdr, backgroundColor: c.cardBg }]}>
              <View style={[styles.iconTileSmall, { backgroundColor: c.tealDim }]}>
                <FitnessIcon name="clock" color={c.teal} size={18} />
              </View>
              <Text style={[styles.highlightLabel, { color: c.muted }]}>Longest session</Text>
              <Text style={[styles.highlightValue, { color: c.text }]}>
                {longestSession ? `${longestSession.minutes} min` : 'No sessions'}
              </Text>
              <Text style={[styles.highlightDescription, { color: c.muted }]}>
                {longestSession?.title ?? 'A fresh start awaits'}
              </Text>
            </View>
            <View style={[styles.highlight, { borderColor: c.cardBdr, backgroundColor: c.cardBg }]}>
              <View style={[styles.iconTileSmall, { backgroundColor: c.tealDim }]}>
                <FitnessIcon name="trend-up" color={c.teal} size={18} />
              </View>
              <Text style={[styles.highlightLabel, { color: c.muted }]}>Session comparison</Text>
              <Text style={[styles.highlightValue, { color: c.text }]}>
                {summary.hasPreviousData
                  ? workoutChange === 0 ? 'Steady pace' : `${workoutChange > 0 ? '+' : ''}${workoutChange}`
                  : 'Building history'}
              </Text>
              <Text style={[styles.highlightDescription, { color: c.muted }]}>
                {summary.hasPreviousData
                  ? summary.comparisonLabel
                  : 'Your first year of demo activity'}
              </Text>
            </View>
          </View>
        </ProfileReveal>

        <ProfileReveal delay={260}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text style={[styles.eyebrow, { color: c.muted }]}>THE WORK BEHIND THE NUMBERS</Text>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: c.text }]}>Session journal</Text>
            </View>
            <ProfilePressable
              label="Open workout history"
              testID="progress-history"
              onPress={() => router.push('/member4/workout-history')}
              style={[styles.roundButton, { borderColor: c.cardBdr, backgroundColor: c.cardBg }]}
            >
              <FitnessIcon name="history" color={c.teal} size={20} />
            </ProfilePressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
            accessibilityRole="tablist"
            accessibilityLabel="Filter sessions by workout type"
          >
            {CATEGORIES.map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="tab"
                accessibilityLabel={`${item.label} sessions`}
                accessibilityState={{ selected: category === item.value }}
                testID={`progress-filter-${item.value}`}
                onPress={() => selectCategory(item.value)}
                style={({ pressed }) => [
                  styles.filter,
                  {
                    backgroundColor: category === item.value ? N.surface : c.cardBg,
                    borderColor: category === item.value ? N.border : c.cardBdr,
                  },
                  pressed && styles.pressed,
                ]}
              >
                {item.value === 'all' && (
                  <FitnessIcon name="filter" color={category === item.value ? N.accent : c.muted} size={15} />
                )}
                <Text style={[styles.filterText, { color: category === item.value ? N.accent : c.muted }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.journal}>
            {displayedSessions.map((session) => {
              const expanded = expandedSessionId === session.id;
              const categoryLabel = CATEGORIES.find((item) => item.value === session.category)?.label;
              return (
                <View key={session.id} style={[styles.session, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${session.title}, ${session.date}, ${session.minutes} minutes`}
                    accessibilityHint="Show or hide the session summary"
                    accessibilityState={{ expanded }}
                    testID={`progress-session-${session.id}`}
                    onPress={() => setExpandedSessionId(expanded ? null : session.id)}
                    style={({ pressed }) => [styles.sessionButton, pressed && styles.pressed]}
                  >
                    <View style={[styles.sessionIcon, { backgroundColor: c.tealDim }]}>
                      <FitnessIcon name={session.category} color={c.teal} size={23} />
                    </View>
                    <View style={styles.sessionCopy}>
                      <Text style={[styles.sessionTitle, { color: c.text }]}>{session.title}</Text>
                      <Text style={[styles.sessionMeta, { color: c.muted }]}>{categoryLabel} · {session.minutes} min</Text>
                    </View>
                    <FitnessIcon name={expanded ? 'chevron-up' : 'chevron-down'} color={c.muted} size={18} />
                  </Pressable>
                  {expanded && (
                    <ProfileReveal>
                      <View style={[styles.sessionDetails, { borderTopColor: c.border }]}>
                        <View style={styles.sessionDetailRow}>
                          <View style={styles.detailLabelGroup}>
                            <FitnessIcon name="calendar" color={c.muted} size={16} />
                            <Text style={[styles.detailLabel, { color: c.muted }]}>Date</Text>
                          </View>
                          <Text style={[styles.detailValue, { color: c.text }]}>{session.date}</Text>
                        </View>
                        <View style={styles.sessionDetailRow}>
                          <View style={styles.detailLabelGroup}>
                            <FitnessIcon name="flame" color={c.muted} size={16} />
                            <Text style={[styles.detailLabel, { color: c.muted }]}>Estimated energy</Text>
                          </View>
                          <Text style={[styles.detailValue, { color: c.text }]}>{session.calories} kcal</Text>
                        </View>
                        <View style={styles.sessionDetailRow}>
                          <View style={styles.detailLabelGroup}>
                            <FitnessIcon name="check" color={c.teal} size={16} />
                            <Text style={[styles.detailLabel, { color: c.muted }]}>Status</Text>
                          </View>
                          <Text style={[styles.detailValue, { color: c.teal }]}>Completed</Text>
                        </View>
                      </View>
                    </ProfileReveal>
                  )}
                </View>
              );
            })}
            {displayedSessions.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
                <View style={[styles.iconTile, { backgroundColor: c.tealDim }]}>
                  <FitnessIcon name="workouts" color={c.teal} size={24} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>No sessions in this view</Text>
                <Text style={[styles.emptyDescription, { color: c.muted }]}>
                  Try another workout type or switch the report period.
                </Text>
                <ProfilePressable
                  label="Show all workout types"
                  onPress={() => selectCategory('all')}
                  style={[styles.resetFilter, { backgroundColor: c.tealDim }]}
                >
                  <Text style={[styles.resetFilterText, { color: c.teal }]}>Show all types</Text>
                </ProfilePressable>
              </View>
            )}
          </View>
          {remainingSessions > 0 && (
            <ProfilePressable
              label={`Show ${Math.min(3, remainingSessions)} more sessions`}
              testID="progress-more-sessions"
              onPress={() => setVisibleSessions((count) => count + 3)}
              style={[styles.loadMore, { borderColor: c.cardBdr }]}
            >
              <Text style={[styles.loadMoreText, { color: c.text }]}>Show {Math.min(3, remainingSessions)} more sessions</Text>
              <FitnessIcon name="chevron-down" color={c.teal} size={17} />
            </ProfilePressable>
          )}
          <Text style={[styles.journalCount, { color: c.muted }]}>
            Showing {displayedSessions.length} of {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'} in this view
          </Text>
        </ProfileReveal>

        <ProfileReveal delay={290}>
          <View style={[styles.aboutCard, { borderColor: c.cardBdr }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="About this report"
              accessibilityState={{ expanded: aboutOpen }}
              testID="progress-about"
              onPress={() => setAboutOpen((open) => !open)}
              style={({ pressed }) => [styles.aboutButton, pressed && styles.pressed]}
            >
              <FitnessIcon name="info" color={c.muted} size={19} />
              <View style={styles.aboutCopy}>
                <Text style={[styles.aboutTitle, { color: c.text }]}>About your numbers</Text>
                <Text style={[styles.aboutSubtitle, { color: c.muted }]}>Demo report · 4 October 2026</Text>
              </View>
              <FitnessIcon name={aboutOpen ? 'chevron-up' : 'chevron-down'} color={c.muted} size={16} />
            </Pressable>
            {aboutOpen && (
              <ProfileReveal>
                <View style={[styles.aboutDetails, { borderTopColor: c.border }]}>
                  <Text style={[styles.aboutParagraph, { color: c.muted }]}>
                    This preview uses sample completed sessions, not connected workout or health data.
                    Your totals, chart, journal, and training mix are calculated from the same sessions.
                  </Text>
                  <Text style={[styles.aboutParagraph, { color: c.muted }]}>
                    Week covers the last 7 days. Month covers the last 28 days. Year runs from
                    1 January to the report date. Comparisons use the preceding equivalent period.
                  </Text>
                  <Text style={[styles.aboutParagraph, { color: c.muted }]}>
                    The calendar always shows the last 28 days. Calories are sample estimates,
                    and targets are demo targets. A day without a logged session is not a missed goal.
                  </Text>
                </View>
              </ProfileReveal>
            )}
          </View>
          <View style={styles.signature}>
            <View style={[styles.signatureLine, { backgroundColor: c.border }]} />
            <FitnessIcon name="activity" color={c.teal} size={19} />
            <View style={[styles.signatureLine, { backgroundColor: c.border }]} />
          </View>
          <Text style={[styles.signatureText, { color: c.muted }]}>Your pace. Your progress.</Text>
        </ProfileReveal>
      </ScrollView>
    </M4Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 18 : 10,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  brand: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  avatar: {
  width: 46,
  height: 46,
  borderRadius: 23,
  alignItems: 'center',
  justifyContent: 'center',
},

  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    height: 11,
    width: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  reportHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  rangeCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  rangeText: {
    fontSize: 12,
    flexShrink: 1,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tinyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  demoText: {
    fontSize: 9,
    fontWeight: '600',
  },
  periodControl: {
    flexDirection: 'row',
    borderRadius: 17,
    borderWidth: 1,
    padding: 4,
    gap: 3,
    marginBottom: 18,
  },
  periodButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  periodSelected: {
    backgroundColor: N.accent,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  hero: {
    padding: 20,
    borderRadius: 26,
    backgroundColor: N.surface,
    borderWidth: 1,
    borderColor: N.border,
    overflow: 'hidden',
  },
  heroOrbit: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 35,
    borderColor: 'rgba(212,249,85,0.035)',
    right: -120,
    top: -125,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  heroEyebrow: {
    color: N.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    flexShrink: 1,
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  heroCopy: {
    flex: 1,
    minWidth: 125,
    gap: 12,
  },
  heroTitle: {
    color: N.text,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -1,
  },
  heroDescription: {
    color: N.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: N.border,
    paddingTop: 18,
    marginTop: 22,
    gap: 10,
  },
  heroStat: {
    flex: 1,
    gap: 5,
  },
  heroValue: {
    color: N.accent,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  heroStatLabel: {
    color: N.muted,
    fontSize: 9,
    lineHeight: 13,
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: N.border,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: 125,
    padding: 15,
    borderRadius: 21,
    borderWidth: 1,
    gap: 12,
  },
  metricHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  iconTileSmall: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  metricValue: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0,
  },
  metricDescription: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: -5,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 28,
    marginBottom: 14,
  },
  sectionCopy: {
    flex: 1,
    minWidth: 160,
    gap: 6,
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.65,
  },
  sectionMeta: {
    fontSize: 10,
    fontWeight: '500',
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 18,
    borderRadius: 23,
    borderWidth: 1,
  },
  metricControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 20,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    flex: 1,
    minWidth: 72,
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 7,
    gap: 5,
  },
  metricButtonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chartTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  chartTotalCopy: {
    flex: 1,
    gap: 6,
  },
  chartValue: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  chartUnit: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
  },
  chartIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodySmall: {
    fontSize: 11,
    lineHeight: 17,
  },
  chartSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderRadius: 13,
    marginTop: 14,
  },
  selectionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  selectionCopy: {
    flex: 1,
    minWidth: 110,
    gap: 4,
  },
  selectionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectionHint: {
    fontSize: 9,
    lineHeight: 13,
  },
  selectionValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  comparison: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 14,
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  comparisonText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },
  consistencyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  flexCopy: {
    flex: 1,
    gap: 5,
  },
  consistencyValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
  },
  consistencyUnit: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarLabels: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekday: {
    width: '14.285714%',
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHitArea: {
    width: '14.285714%',
    minHeight: 44,
    padding: 3,
  },
  dayCell: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 3,
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: '500',
  },
  dayNumberSelected: {
    fontWeight: '800',
  },
  dayDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 15,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSquare: {
    height: 8,
    width: 8,
    borderWidth: 1,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
  },
  selectedDaySummary: {
    marginTop: 18,
    paddingTop: 14,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  daySummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 5,
  },
  categorySeparator: {
    marginTop: 16,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  categoryContent: {
    flex: 1,
    gap: 10,
  },
  categoryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryDescription: {
    fontSize: 10,
    marginTop: -3,
  },
  balanceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  highlight: {
    flex: 1,
    minWidth: 125,
    padding: 16,
    borderWidth: 1,
    borderRadius: 21,
    gap: 10,
  },
  highlightLabel: {
    fontSize: 10,
    lineHeight: 15,
  },
  highlightValue: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  highlightDescription: {
    fontSize: 10,
    lineHeight: 16,
  },
  filterContent: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  journal: {
    gap: 10,
  },
  session: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 12,
    minHeight: 82,
  },
  sessionIcon: {
    height: 44,
    width: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  sessionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sessionMeta: {
    fontSize: 10,
    lineHeight: 15,
  },
  sessionDetails: {
    padding: 16,
    paddingTop: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 11,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 21,
    borderWidth: 1,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  resetFilter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 4,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  journalCount: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 12,
  },
  aboutCard: {
    marginTop: 28,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 15,
    minHeight: 68,
  },
  aboutCopy: {
    flex: 1,
    gap: 5,
  },
  aboutTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  aboutSubtitle: {
    fontSize: 10,
  },
  aboutDetails: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  aboutParagraph: {
    fontSize: 12,
    lineHeight: 19,
  },
  signature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 9,
  },
  signatureLine: {
    height: StyleSheet.hairlineWidth,
    width: 32,
  },
  signatureText: {
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 0.25,
  },
});

/**
 * Deterministic, local demonstration data for the Progress dashboard.
 * Calendar dates are day keys, not device timestamps. UTC arithmetic keeps
 * period membership identical on devices in different time zones.
 */
import { mockGoals, mockProgressStats, mockUserProfile } from './mockData';

export type Period = 'week' | 'month' | 'year';
export type Metric = 'minutes' | 'workouts' | 'calories';
export type Category = 'strength' | 'cardio' | 'mobility';

export interface Session {
  id: string;
  title: string;
  date: string;
  minutes: number;
  calories: number;
  category: Category;
}

export interface MetricTotals {
  workouts: number;
  minutes: number;
  calories: number;
}

export interface DashboardBar {
  id: string;
  label: string;
  fullLabel: string;
  totals: MetricTotals;
}

export interface MetricBar {
  id: string;
  label: string;
  fullLabel: string;
  value: number;
}

export interface CategorySummary {
  category: Category;
  label: string;
  minutes: number;
  count: number;
  percent: number;
}

export interface ActivityDay {
  date: string;
  label: string;
  weekday: string;
  minutes: number;
  workouts: number;
  isToday: boolean;
}

export interface DashboardSummary {
  period: Period;
  label: string;
  rangeLabel: string;
  comparisonLabel: string;
  targetLabel: string;
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  totals: MetricTotals;
  previousTotals: MetricTotals;
  target: MetricTotals;
  hasPreviousData: boolean;
  activeDays: number;
  totalDays: number;
  averageMinutes: number;
  categories: CategorySummary[];
  sessions: Session[];
  bars: DashboardBar[];
  /** Last 28 days of the demo snapshot, independent of the period filter. */
  calendar: ActivityDay[];
  calendarRangeLabel: string;
  bestSession: Session | null;
  mostActiveDay: { date: string; label: string; minutes: number } | null;
}

export const DEMO_AS_OF = '2026-10-04';

export const DASHBOARD_DEMO = {
  asOf: DEMO_AS_OF,
  label: 'Demo activity',
  dateLabel: '4 October 2026',
  firstName: mockUserProfile.fullName.split(' ')[0],
  // Kept as the existing profile snapshot; this is not a workout-day streak.
  streakDays: mockProgressStats.streakDays,
  streakLabel: 'Check-in streak',
  notice: 'Sample sessions through 4 October 2026. Live workout tracking is not connected.',
} as const;

export const PERIOD_OPTIONS: readonly { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export const METRIC_OPTIONS: readonly {
  value: Metric;
  label: string;
  unit: string;
}[] = [
  { value: 'minutes', label: 'Minutes', unit: 'min' },
  { value: 'workouts', label: 'Workouts', unit: 'sessions' },
  { value: 'calories', label: 'Calories', unit: 'kcal' },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  mobility: 'Mobility',
};

const DAY_MS = 86_400_000;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES: Category[] = ['strength', 'cardio', 'mobility'];

function dateValue(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function addDays(date: string, offset: number): string {
  return new Date(dateValue(date) + offset * DAY_MS).toISOString().slice(0, 10);
}

export function formatSessionDate(date: string): string {
  const parsed = new Date(dateValue(date));
  return `${parsed.getUTCDate()} ${MONTH_NAMES[parsed.getUTCMonth()].slice(0, 3)}`;
}

function rangeLabel(startDate: string, endDate: string): string {
  return `${formatSessionDate(startDate)} – ${formatSessionDate(endDate)}, ${endDate.slice(0, 4)}`;
}

function daysBetween(startDate: string, endDate: string): number {
  return Math.round((dateValue(endDate) - dateValue(startDate)) / DAY_MS) + 1;
}

function datesBetween(startDate: string, endDate: string): string[] {
  return Array.from({ length: daysBetween(startDate, endDate) }, (_, index) => addDays(startDate, index));
}

export function sumSessions(sessions: readonly Session[]): MetricTotals {
  return sessions.reduce<MetricTotals>(
    (total, session) => ({
      workouts: total.workouts + 1,
      minutes: total.minutes + session.minutes,
      calories: total.calories + session.calories,
    }),
    { workouts: 0, minutes: 0, calories: 0 },
  );
}

/** No percentage change exists when the previous amount is zero. */
export function getChangePercent(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/** Bounded progress for bars/rings, including missing or invalid targets. */
export function getCompletionPercent(current: number, target: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

function createHistoricalSessions(): Session[] {
  const sessions: Session[] = [];
  const templates: Record<number, { title: string; minutes: number; category: Category; rate: number }> = {
    1: { title: 'Full Body Strength', minutes: 28, category: 'strength', rate: 7 },
    2: { title: 'Steady Cardio', minutes: 30, category: 'cardio', rate: 8 },
    4: { title: 'Core & Stability', minutes: 24, category: 'strength', rate: 7 },
    6: { title: 'Mobility Flow', minutes: 20, category: 'mobility', rate: 4 },
  };

  for (const date of datesBetween('2026-01-01', '2026-09-27')) {
    const parsed = new Date(dateValue(date));
    const template = templates[parsed.getUTCDay()];
    if (!template) continue;
    // A fixed training pattern with a modest progression each quarter.
    const progression = Math.floor(parsed.getUTCMonth() / 3) * 3;
    const minutes = template.minutes + progression;
    sessions.push({
      id: `demo-${date}`,
      title: template.title,
      date,
      minutes,
      calories: minutes * template.rate,
      category: template.category,
    });
  }
  return sessions;
}

/** The current week reconciles with the profile's existing 4 / 128 / 940 snapshot. */
const CURRENT_WEEK_SESSIONS: Session[] = [
  { id: 'demo-2026-09-28', title: 'Full Body Strength', date: '2026-09-28', minutes: 35, calories: 260, category: 'strength' },
  { id: 'demo-2026-09-30', title: 'Cardio Intervals', date: '2026-09-30', minutes: 38, calories: 310, category: 'cardio' },
  { id: 'demo-2026-10-02', title: 'Core & Stability', date: '2026-10-02', minutes: 30, calories: 240, category: 'strength' },
  { id: 'demo-2026-10-04', title: 'Sunday Mobility', date: '2026-10-04', minutes: 25, calories: 130, category: 'mobility' },
];

export const DEMO_SESSIONS: readonly Session[] = [
  ...createHistoricalSessions(),
  ...CURRENT_WEEK_SESSIONS,
];

const WEEKLY_TARGET: MetricTotals = {
  workouts: mockProgressStats.workoutsTarget,
  minutes: mockProgressStats.targetMinutes,
  calories: mockGoals.find((goal) => goal.type === 'Calories per week')?.targetValue ?? 1200,
};

function sessionsInRange(startDate: string, endDate: string): Session[] {
  return DEMO_SESSIONS.filter((session) => session.date >= startDate && session.date <= endDate);
}

function periodDates(period: Period) {
  if (period === 'week') {
    return {
      label: 'This week',
      startDate: addDays(DEMO_AS_OF, -6),
      previousStartDate: addDays(DEMO_AS_OF, -13),
      previousEndDate: addDays(DEMO_AS_OF, -7),
      comparisonLabel: 'vs previous week',
      targetLabel: 'Weekly targets',
      targetMultiplier: 1,
    };
  }
  if (period === 'month') {
    return {
      label: 'Last 28 days',
      startDate: addDays(DEMO_AS_OF, -27),
      previousStartDate: addDays(DEMO_AS_OF, -55),
      previousEndDate: addDays(DEMO_AS_OF, -28),
      comparisonLabel: 'vs previous 28 days',
      targetLabel: 'Four-week targets',
      targetMultiplier: 4,
    };
  }
  return {
    label: 'Year to date',
    startDate: '2026-01-01',
    previousStartDate: '2025-01-01',
    previousEndDate: '2025-10-04',
    comparisonLabel: 'No 2025 comparison data',
    targetLabel: 'Annual targets · 52 weeks',
    targetMultiplier: 52,
  };
}

function buildBars(period: Period, startDate: string, sessions: Session[]): DashboardBar[] {
  if (period === 'week') {
    return datesBetween(startDate, DEMO_AS_OF).map((date) => {
      const weekday = DAY_NAMES[new Date(dateValue(date)).getUTCDay()];
      return {
        id: date,
        label: weekday.slice(0, 1),
        fullLabel: `${weekday}, ${formatSessionDate(date)}`,
        totals: sumSessions(sessions.filter((session) => session.date === date)),
      };
    });
  }
  if (period === 'month') {
    return Array.from({ length: 4 }, (_, index) => {
      const firstDay = addDays(startDate, index * 7);
      const lastDay = addDays(firstDay, 6);
      return {
        id: firstDay,
        label: `W${index + 1}`,
        fullLabel: `${formatSessionDate(firstDay)} – ${formatSessionDate(lastDay)}`,
        totals: sumSessions(sessions.filter((session) => session.date >= firstDay && session.date <= lastDay)),
      };
    });
  }
  const monthCount = new Date(dateValue(DEMO_AS_OF)).getUTCMonth() + 1;
  return Array.from({ length: monthCount }, (_, index) => {
    const month = `2026-${String(index + 1).padStart(2, '0')}`;
    return {
      id: month,
      label: MONTH_NAMES[index].slice(0, 1),
      fullLabel: `${MONTH_NAMES[index]} 2026${index === monthCount - 1 ? ' · through 4 Oct' : ''}`,
      totals: sumSessions(sessions.filter((session) => session.date.startsWith(month))),
    };
  });
}

function activityCalendar(): ActivityDay[] {
  return datesBetween(addDays(DEMO_AS_OF, -27), DEMO_AS_OF).map((date) => {
    const totals = sumSessions(sessionsInRange(date, date));
    return {
      date,
      label: formatSessionDate(date),
      weekday: DAY_NAMES[new Date(dateValue(date)).getUTCDay()],
      minutes: totals.minutes,
      workouts: totals.workouts,
      isToday: date === DEMO_AS_OF,
    };
  });
}

export function getDashboardSummary(period: Period): DashboardSummary {
  const config = periodDates(period);
  const sessions = sessionsInRange(config.startDate, DEMO_AS_OF).sort((a, b) => b.date.localeCompare(a.date));
  const previousSessions = sessionsInRange(config.previousStartDate, config.previousEndDate);
  const totals = sumSessions(sessions);
  const activeDates = [...new Set(sessions.map((session) => session.date))];
  const dailyTotals = activeDates.map((date) => ({
    date,
    label: formatSessionDate(date),
    minutes: sumSessions(sessions.filter((session) => session.date === date)).minutes,
  }));
  const mostActiveDay = dailyTotals.reduce<DashboardSummary['mostActiveDay']>(
    (best, day) => !best || day.minutes > best.minutes ? day : best,
    null,
  );
  const categories = CATEGORIES.map((category) => {
    const categorySessions = sessions.filter((session) => session.category === category);
    const categoryTotals = sumSessions(categorySessions);
    return {
      category,
      label: CATEGORY_LABELS[category],
      minutes: categoryTotals.minutes,
      count: categoryTotals.workouts,
      percent: totals.minutes > 0 ? Math.round((categoryTotals.minutes / totals.minutes) * 100) : 0,
    };
  });
  return {
    period,
    label: config.label,
    rangeLabel: rangeLabel(config.startDate, DEMO_AS_OF),
    comparisonLabel: config.comparisonLabel,
    targetLabel: config.targetLabel,
    startDate: config.startDate,
    endDate: DEMO_AS_OF,
    previousStartDate: config.previousStartDate,
    previousEndDate: config.previousEndDate,
    totals,
    previousTotals: sumSessions(previousSessions),
    target: {
      workouts: WEEKLY_TARGET.workouts * config.targetMultiplier,
      minutes: WEEKLY_TARGET.minutes * config.targetMultiplier,
      calories: WEEKLY_TARGET.calories * config.targetMultiplier,
    },
    hasPreviousData: previousSessions.length > 0,
    activeDays: activeDates.length,
    totalDays: daysBetween(config.startDate, DEMO_AS_OF),
    averageMinutes: totals.workouts > 0 ? Math.round(totals.minutes / totals.workouts) : 0,
    categories,
    sessions,
    bars: buildBars(period, config.startDate, sessions),
    calendar: activityCalendar(),
    calendarRangeLabel: rangeLabel(addDays(DEMO_AS_OF, -27), DEMO_AS_OF),
    bestSession: sessions.reduce<Session | null>((best, session) => !best || session.minutes > best.minutes ? session : best, null),
    mostActiveDay,
  };
}

export function getMetricBars(summary: DashboardSummary, metric: Metric): MetricBar[] {
  return summary.bars.map((bar) => ({
    id: bar.id,
    label: bar.label,
    fullLabel: bar.fullLabel,
    value: bar.totals[metric],
  }));
}

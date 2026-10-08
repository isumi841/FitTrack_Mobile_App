/** Progress calculations adapted from Member4; inputs are saved session records. */


export type Period = 'week' | 'month' | 'year';
export type Metric = 'minutes' | 'workouts' | 'calories';
export type Category = 'strength' | 'cardio' | 'mobility' | 'other';

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
  /** Last 28 days through the report date, independent of the period filter. */
  calendar: ActivityDay[];
  calendarRangeLabel: string;
  bestSession: Session | null;
  mostActiveDay: { date: string; label: string; minutes: number } | null;
}

export const REPORT_DATE = new Date().toISOString().slice(0, 10);

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
  other: 'Uncategorized',
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
const CATEGORIES: Category[] = ['strength', 'cardio', 'mobility', 'other'];

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

function sessionsInRange(allSessions: readonly Session[], startDate: string, endDate: string): Session[] {
  return allSessions.filter((session) => session.date >= startDate && session.date <= endDate);
}

function periodDates(period: Period) {
  if (period === 'week') {
    return {
      label: 'This week',
      startDate: addDays(REPORT_DATE, -6),
      previousStartDate: addDays(REPORT_DATE, -13),
      previousEndDate: addDays(REPORT_DATE, -7),
      comparisonLabel: 'vs previous week',
      targetLabel: 'Weekly targets',
      targetMultiplier: 1,
    };
  }
  if (period === 'month') {
    return {
      label: 'Last 28 days',
      startDate: addDays(REPORT_DATE, -27),
      previousStartDate: addDays(REPORT_DATE, -55),
      previousEndDate: addDays(REPORT_DATE, -28),
      comparisonLabel: 'vs previous 28 days',
      targetLabel: 'Four-week targets',
      targetMultiplier: 4,
    };
  }
  return {
    label: 'Year to date',
    startDate: REPORT_DATE.slice(0, 4) + '-01-01',
    previousStartDate: String(Number(REPORT_DATE.slice(0, 4)) - 1) + '-01-01',
    previousEndDate: String(Number(REPORT_DATE.slice(0, 4)) - 1) + REPORT_DATE.slice(4),
    comparisonLabel: 'vs previous year',
    targetLabel: 'Annual targets · 52 weeks',
    targetMultiplier: 52,
  };
}

function buildBars(period: Period, startDate: string, sessions: Session[]): DashboardBar[] {
  if (period === 'week') {
    return datesBetween(startDate, REPORT_DATE).map((date) => {
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
  const monthCount = new Date(dateValue(REPORT_DATE)).getUTCMonth() + 1;
  return Array.from({ length: monthCount }, (_, index) => {
    const month = `${REPORT_DATE.slice(0, 4)}-${String(index + 1).padStart(2, '0')}`;
    return {
      id: month,
      label: MONTH_NAMES[index].slice(0, 1),
      fullLabel: `${MONTH_NAMES[index]} ${REPORT_DATE.slice(0, 4)}`,
      totals: sumSessions(sessions.filter((session) => session.date.startsWith(month))),
    };
  });
}

function activityCalendar(allSessions: readonly Session[]): ActivityDay[] {
  return datesBetween(addDays(REPORT_DATE, -27), REPORT_DATE).map((date) => {
    const totals = sumSessions(sessionsInRange(allSessions, date, date));
    return {
      date,
      label: formatSessionDate(date),
      weekday: DAY_NAMES[new Date(dateValue(date)).getUTCDay()],
      minutes: totals.minutes,
      workouts: totals.workouts,
      isToday: date === REPORT_DATE,
    };
  });
}

export function getDashboardSummary(period: Period, allSessions: readonly Session[] = [], weeklyTarget: MetricTotals = { workouts: 0, minutes: 0, calories: 0 }): DashboardSummary {
  const config = periodDates(period);
  const sessions = sessionsInRange(allSessions, config.startDate, REPORT_DATE).sort((a, b) => b.date.localeCompare(a.date));
  const previousSessions = sessionsInRange(allSessions, config.previousStartDate, config.previousEndDate);
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
    rangeLabel: rangeLabel(config.startDate, REPORT_DATE),
    comparisonLabel: config.comparisonLabel,
    targetLabel: config.targetLabel,
    startDate: config.startDate,
    endDate: REPORT_DATE,
    previousStartDate: config.previousStartDate,
    previousEndDate: config.previousEndDate,
    totals,
    previousTotals: sumSessions(previousSessions),
    target: {
      workouts: weeklyTarget.workouts * config.targetMultiplier,
      minutes: weeklyTarget.minutes * config.targetMultiplier,
      calories: weeklyTarget.calories * config.targetMultiplier,
    },
    hasPreviousData: previousSessions.length > 0,
    activeDays: activeDates.length,
    totalDays: daysBetween(config.startDate, REPORT_DATE),
    averageMinutes: totals.workouts > 0 ? Math.round(totals.minutes / totals.workouts) : 0,
    categories,
    sessions,
    bars: buildBars(period, config.startDate, sessions),
    calendar: activityCalendar(allSessions),
    calendarRangeLabel: rangeLabel(addDays(REPORT_DATE, -27), REPORT_DATE),
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

import type { AchievementItem } from '../components/AchievementBadge';
import type { Session } from '@/features/workout/engine';
import type { ApiGoal } from '../services/member4Service';
import { longestStreak } from './session-activity';
const DEFINITIONS: AchievementItem[] = [
  {
    id: 'first-workout',
    title: 'First Workout',
    category: 'Training',
    description:
      'Completed your first FitTrack workout and officially started your fitness journey.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 02, 2026',
    icon: 'check',
    targetLabel: 'Complete your first workout',
    currentLabel: '1 / 1 workout',
  },

  {
    id: 'seven-day-streak',
    title: '7-Day Streak',
    category: 'Streak',
    description:
      'Completed workouts 7 days in a row without missing a single day. Consistency is the foundation of progress.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 17, 2026',
    icon: 'flame',
    targetLabel: 'Train 7 days in a row',
    currentLabel: '7 / 7 days',
  },

  {
    id: 'early-bird',
    title: 'Early Bird',
    category: 'Consistency',
    description:
      'Completed five workouts before 8:00 AM and proved that strong days can start early.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 12, 2026',
    icon: 'spark',
    targetLabel: 'Complete 5 early workouts',
    currentLabel: '5 / 5 workouts',
  },

  {
    id: 'ten-workouts',
    title: '10 Workouts',
    category: 'Training',
    description:
      'Completed your first ten workout sessions and built a strong training foundation.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 21, 2026',
    icon: 'workouts',
    targetLabel: 'Complete 10 workouts',
    currentLabel: '10 / 10 workouts',
  },

  {
    id: 'calorie-crusher',
    title: 'Calorie Crusher',
    category: 'Energy',
    description:
      'Burned more than 3,000 active workout calories through consistent training.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 24, 2026',
    icon: 'flame',
    targetLabel: 'Burn 3,000 workout calories',
    currentLabel: '3,000 / 3,000 kcal',
  },

  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    category: 'Consistency',
    description:
      'Stayed active across four different weekends instead of letting the weekend stop your momentum.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 27, 2026',
    icon: 'calendar',
    targetLabel: 'Train across 4 weekends',
    currentLabel: '4 / 4 weekends',
  },

  {
    id: 'goal-getter',
    title: 'Goal Getter',
    category: 'Consistency',
    description:
      'Completed your first personal fitness goal inside FitTrack.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Sep 29, 2026',
    icon: 'goal',
    targetLabel: 'Complete one fitness goal',
    currentLabel: '1 / 1 goal',
  },

  {
    id: 'momentum-builder',
    title: 'Momentum Builder',
    category: 'Training',
    description:
      'Completed four workouts in one week and maintained strong weekly momentum.',
    unlocked: true,
    progress: 100,
    earnedOn: 'Oct 01, 2026',
    icon: 'trend-up',
    targetLabel: 'Complete 4 workouts in a week',
    currentLabel: '4 / 4 workouts',
  },

  {
    id: 'thirty-day-streak',
    title: '30-Day Streak',
    category: 'Streak',
    description:
      'Build an exceptional training habit by staying active for 30 consecutive days.',
    unlocked: false,
    progress: 20,
    icon: 'flame',
    targetLabel: 'Train for 30 consecutive days',
    currentLabel: '6 / 30 days',
  },

  {
    id: 'fifty-workouts',
    title: '50 Workouts',
    category: 'Training',
    description:
      'Complete fifty workout sessions and reach a major FitTrack training milestone.',
    unlocked: false,
    progress: 24,
    icon: 'workouts',
    targetLabel: 'Complete 50 workouts',
    currentLabel: '12 / 50 workouts',
  },

  {
    id: 'marathon-mind',
    title: 'Marathon Mind',
    category: 'Consistency',
    description:
      'Accumulate 500 total workout minutes and prove that long-term effort adds up.',
    unlocked: false,
    progress: 64,
    icon: 'trend-up',
    targetLabel: 'Complete 500 workout minutes',
    currentLabel: '320 / 500 min',
  },
];

export function getAchievements(sessions: readonly Session[], goals: readonly ApiGoal[]): AchievementItem[] {
  const completed = sessions.filter(session => session.status === 'completed');
  const dates = completed.map(session => new Date(session.finishedAt ?? session.startedAt));
  const weekends = new Set(dates.filter(date => [0, 6].includes(date.getUTCDay())).map(date => { const sunday = new Date(date); sunday.setUTCDate(date.getUTCDate() + (date.getUTCDay() === 6 ? 1 : 0)); return sunday.toISOString().slice(0, 10); }));
  const count = completed.length;
  const bestWeek = dates.reduce((best, date) => Math.max(best, dates.filter(other => other.getTime() <= date.getTime() && other.getTime() > date.getTime() - 7 * 86400000).length), 0);
  const streak = longestStreak(completed);
  const values: Record<string, [number, number]> = {
    'first-workout': [count, 1], 'seven-day-streak': [streak, 7], 'early-bird': [dates.filter(date => date.getHours() < 8).length, 5],
    'ten-workouts': [count, 10], 'calorie-crusher': [0, 3000], 'weekend-warrior': [weekends.size, 4],
    'goal-getter': [goals.filter(goal => goal.current >= goal.target || goal.status === 'completed').length, 1],
    'momentum-builder': [bestWeek, 4], 'thirty-day-streak': [streak, 30], 'fifty-workouts': [count, 50],
    'marathon-mind': [Math.floor(sessions.reduce((sum, session) => sum + session.elapsedMs, 0) / 60000), 500],
  };
  return DEFINITIONS.map(item => { const [current, target] = values[item.id]; return { ...item, unlocked: current >= target, progress: Math.min(100, Math.round(current / target * 100)), earnedOn: undefined,
    currentLabel: item.id === 'calorie-crusher' ? 'Calorie tracking is not connected' : current + ' / ' + target }; });
}

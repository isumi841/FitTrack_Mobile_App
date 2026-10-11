import test from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardSummary, REPORT_DATE } from '../../src/features/member4/data/progressDashboard.ts';
import { computeGoalProgress } from '../../src/features/member4/data/session-activity.ts';

test('Member4 charts start empty and use only the supplied saved sessions', () => {
  const empty = getDashboardSummary('week');
  assert.equal(empty.sessions.length, 0);
  assert.deepEqual(empty.totals, { workouts: 0, minutes: 0, calories: 0 });
  assert.deepEqual(empty.target, { workouts: 0, minutes: 0, calories: 0 });
  const sessions = [{ id: 'a', title: 'Saved workout', date: REPORT_DATE, minutes: 2.5, calories: 0, category: 'other' },
    { id: 'b', title: 'Old workout', date: '2000-01-01', minutes: 99, calories: 0, category: 'other' }];
  for (const period of ['week', 'month', 'year']) {
    const result = getDashboardSummary(period, sessions, { workouts: 3, minutes: 60, calories: 0 });
    assert.equal(result.totals.workouts, 1);
    assert.equal(result.totals.minutes, 2.5);
    assert.equal(result.categories.find(item => item.category === 'other').count, 1);
    assert.equal(result.bars.reduce((sum, bar) => sum + bar.totals.minutes, 0), 2.5);
    assert.equal(result.calendar.find(day => day.date === REPORT_DATE).workouts, 1);
    assert.ok(result.bars.every(bar => !bar.fullLabel.includes('through 4 Oct')));
  }
});

test('computeGoalProgress accurately updates active goals from finished sessions', () => {
  const now = Date.now();
  const finishedSession = {
    id: 's1', ownerId: 'user1', workoutId: 'w1',
    startedAt: now - 60000, finishedAt: now, status: 'completed',
    elapsedMs: 60000,
  };
  const runningSession = {
    id: 's2', ownerId: 'user1', workoutId: 'w2',
    startedAt: now - 30000, status: 'running',
    elapsedMs: 30000,
  };
  const oldSession = {
    id: 's3', ownerId: 'user1', workoutId: 'w3',
    startedAt: now - 15 * 86400000, finishedAt: now - 15 * 86400000, status: 'completed',
    elapsedMs: 120000,
  };

  const minutesGoal = {
    _id: 'g1', userId: 'user1', goalType: 'workoutMinutes', title: 'Train 1 minutes',
    target: 1, current: 0, duration: 'Weekly', status: 'active',
  };
  const weeklyWorkoutsGoal = {
    _id: 'g2', userId: 'user1', goalType: 'workoutsPerWeek', title: 'Work out 3 days a week',
    target: 3, current: 0, duration: 'Weekly', status: 'active',
  };
  const monthlyWorkoutsGoal = {
    _id: 'g3', userId: 'user1', goalType: 'monthlyWorkouts', title: 'Complete 10 workouts',
    target: 10, current: 0, duration: 'Monthly', status: 'active',
  };

  // Only finished sessions in the window count
  assert.equal(computeGoalProgress(minutesGoal, [finishedSession, runningSession]), 1);
  assert.equal(computeGoalProgress(weeklyWorkoutsGoal, [finishedSession, runningSession, oldSession]), 1);
  assert.equal(computeGoalProgress(monthlyWorkoutsGoal, [finishedSession, runningSession, oldSession]), 2);
});

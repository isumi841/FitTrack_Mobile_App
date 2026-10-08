import test from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardSummary, REPORT_DATE } from '../../src/features/member4/data/progressDashboard.ts';

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

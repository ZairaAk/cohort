import test from 'node:test';
import assert from 'node:assert/strict';
import { nextStreak } from '../src/services/streak.js';
import { weekStart } from '../src/utils/time.js';

test('first session starts a streak at 1', () => {
  assert.deepEqual(nextStreak({ count: 0, lastDay: null }, '2026-10-25'), { count: 1, lastDay: '2026-10-25' });
});

test('second session on the same day does not increase the streak', () => {
  assert.deepEqual(nextStreak({ count: 3, lastDay: '2026-10-25' }, '2026-10-25'), {
    count: 3,
    lastDay: '2026-10-25',
  });
});

test('next consecutive day increases the streak', () => {
  assert.deepEqual(nextStreak({ count: 3, lastDay: '2026-10-24' }, '2026-10-25'), {
    count: 4,
    lastDay: '2026-10-25',
  });
});

test('missing a day resets the streak to 1', () => {
  assert.deepEqual(nextStreak({ count: 9, lastDay: '2026-10-22' }, '2026-10-25'), {
    count: 1,
    lastDay: '2026-10-25',
  });
});

test('streak works across a month boundary', () => {
  assert.equal(nextStreak({ count: 2, lastDay: '2026-10-31' }, '2026-11-01').count, 3);
});

test('weekStart returns Monday 00:00 UTC', () => {
  // 2026-10-25 is a Sunday, so its week started Monday 2026-10-19
  assert.equal(weekStart(new Date('2026-10-25T18:00:00Z')).toISOString(), '2026-10-19T00:00:00.000Z');
  assert.equal(weekStart(new Date('2026-10-19T00:00:00Z')).toISOString(), '2026-10-19T00:00:00.000Z');
});

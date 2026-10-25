import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSlots, overlapMinutes, scoreMatch, rankMatches } from '../src/services/matching.js';

const slot = (day, startMin, endMin) => ({ day, startMin, endMin });
const user = (subjects, availability, reputation = 0) => ({ subjects, availability, reputation });

test('mergeSlots joins overlapping and touching slots', () => {
  const merged = mergeSlots([slot(1, 600, 660), slot(1, 650, 720), slot(1, 720, 780), slot(2, 0, 60)]);
  assert.deepEqual(
    merged.filter((s) => s.day === 1),
    [slot(1, 600, 780)]
  );
  assert.equal(merged.length, 2);
});

test('overlapMinutes does not double count a user\'s own overlapping slots', () => {
  const a = [slot(1, 600, 700), slot(1, 650, 800)];
  const b = [slot(1, 600, 800)];
  assert.equal(overlapMinutes(a, b), 200);
});

test('overlapMinutes ignores different days', () => {
  assert.equal(overlapMinutes([slot(1, 600, 700)], [slot(2, 600, 700)]), 0);
});

test('scoreMatch returns null with no shared subject', () => {
  const a = user([{ name: 'dsa', level: 3 }], [slot(1, 600, 900)]);
  const b = user([{ name: 'math', level: 3 }], [slot(1, 600, 900)]);
  assert.equal(scoreMatch(a, b), null);
});

test('scoreMatch returns null when shared time is too short', () => {
  const a = user([{ name: 'dsa', level: 3 }], [slot(1, 600, 620)]);
  const b = user([{ name: 'dsa', level: 3 }], [slot(1, 600, 620)]);
  assert.equal(scoreMatch(a, b), null);
});

test('a 1-2 level gap scores higher than a 4 level gap', () => {
  const me = user([{ name: 'dsa', level: 3 }], [slot(1, 600, 900)]);
  const near = user([{ name: 'dsa', level: 4 }], [slot(1, 600, 900)]);
  const far = user([{ name: 'dsa', level: 3 + 0 }], [slot(1, 600, 900)]);
  const veryFar = { ...far, subjects: [{ name: 'dsa', level: 7 }] };
  assert.ok(scoreMatch(me, near).score > scoreMatch(me, veryFar).score);
});

test('more shared availability increases score', () => {
  const me = user([{ name: 'dsa', level: 3 }], [slot(1, 600, 1200)]);
  const little = user([{ name: 'dsa', level: 4 }], [slot(1, 600, 660)]);
  const lots = user([{ name: 'dsa', level: 4 }], [slot(1, 600, 1200)]);
  assert.ok(scoreMatch(me, lots).score > scoreMatch(me, little).score);
});

test('rankMatches sorts by score then reputation and respects limit', () => {
  const me = user([{ name: 'dsa', level: 3 }], [slot(1, 600, 1200)]);
  const best = { ...user([{ name: 'dsa', level: 4 }], [slot(1, 600, 1200)], 5), id: 'best' };
  const okay = { ...user([{ name: 'dsa', level: 4 }], [slot(1, 600, 660)], 50), id: 'okay' };
  const none = { ...user([{ name: 'art', level: 1 }], [slot(1, 600, 1200)]), id: 'none' };
  const ranked = rankMatches(me, [okay, none, best], 5);
  assert.deepEqual(ranked.map((r) => r.user.id), ['best', 'okay']);
  assert.equal(rankMatches(me, [okay, best], 1).length, 1);
});

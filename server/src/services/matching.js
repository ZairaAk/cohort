// Pure matching logic: no DB access, easy to unit test.

const MIN_OVERLAP_MIN = 30; // ignore overlaps shorter than this
const MAX_OVERLAP_MIN = 600; // 10h/week of shared time counts as a full availability score
const SUBJECT_WEIGHT = 0.6;
const AVAILABILITY_WEIGHT = 0.4;

// Merge overlapping or touching slots on the same day so shared time is never double counted.
export function mergeSlots(slots = []) {
  const byDay = new Map();
  for (const s of slots) {
    if (!byDay.has(s.day)) byDay.set(s.day, []);
    byDay.get(s.day).push([s.startMin, s.endMin]);
  }
  const merged = [];
  for (const [day, list] of byDay) {
    list.sort((a, b) => a[0] - b[0]);
    let [curStart, curEnd] = list[0];
    for (let i = 1; i < list.length; i++) {
      const [s, e] = list[i];
      if (s <= curEnd) curEnd = Math.max(curEnd, e);
      else {
        merged.push({ day, startMin: curStart, endMin: curEnd });
        [curStart, curEnd] = [s, e];
      }
    }
    merged.push({ day, startMin: curStart, endMin: curEnd });
  }
  return merged;
}

export function overlapMinutes(slotsA, slotsB) {
  const a = mergeSlots(slotsA);
  const b = mergeSlots(slotsB);
  let total = 0;
  for (const x of a) {
    for (const y of b) {
      if (x.day !== y.day) continue;
      const start = Math.max(x.startMin, y.startMin);
      const end = Math.min(x.endMin, y.endMin);
      if (end > start) total += end - start;
    }
  }
  return total;
}

// Same subject is the base signal. A skill gap of 1-2 levels is best (one can teach the other),
// equal levels are fine for peer study, a gap of 3+ is a poor fit.
function levelBonus(levelA, levelB) {
  const gap = Math.abs(levelA - levelB);
  if (gap === 0) return 0.25;
  if (gap <= 2) return 0.5;
  return 0;
}

export function sharedSubjects(subjectsA = [], subjectsB = []) {
  const theirs = new Map(subjectsB.map((s) => [s.name, s.level]));
  return subjectsA
    .filter((s) => theirs.has(s.name))
    .map((s) => ({ name: s.name, yourLevel: s.level, theirLevel: theirs.get(s.name) }));
}

export function scoreMatch(me, other) {
  const shared = sharedSubjects(me.subjects, other.subjects);
  if (shared.length === 0) return null;

  const overlap = overlapMinutes(me.availability, other.availability);
  if (overlap < MIN_OVERLAP_MIN) return null;

  const subjectRaw = shared.reduce((sum, s) => sum + 1 + levelBonus(s.yourLevel, s.theirLevel), 0);
  const subjectMax = 1.5 * Math.max(1, Math.min(me.subjects.length, other.subjects.length));
  const subjectScore = Math.min(1, subjectRaw / subjectMax);
  const availabilityScore = Math.min(1, overlap / MAX_OVERLAP_MIN);

  const score = Math.round(100 * (SUBJECT_WEIGHT * subjectScore + AVAILABILITY_WEIGHT * availabilityScore));
  return { score, sharedSubjects: shared, overlapMinutes: overlap };
}

export function rankMatches(me, candidates, limit = 20) {
  return candidates
    .map((c) => {
      const result = scoreMatch(me, c);
      return result ? { user: c, ...result } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.user.reputation - a.user.reputation)
    .slice(0, limit);
}

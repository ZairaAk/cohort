// Pure streak logic. Days are UTC date strings (YYYY-MM-DD).

const DAY_MS = 24 * 60 * 60 * 1000;

export function nextStreak(streak, today) {
  const count = streak?.count ?? 0;
  const lastDay = streak?.lastDay ?? null;

  if (!lastDay) return { count: 1, lastDay: today };
  if (lastDay === today) return { count: Math.max(count, 1), lastDay };

  const gapDays = Math.round((Date.parse(today) - Date.parse(lastDay)) / DAY_MS);
  if (gapDays === 1) return { count: count + 1, lastDay: today };
  return { count: 1, lastDay: today }; // missed at least one day, or clock went backwards
}

// Monday 00:00 UTC of the week containing `date`.
export function weekStart(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - sinceMonday);
  return d;
}

// YYYY-MM-DD in UTC.
export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

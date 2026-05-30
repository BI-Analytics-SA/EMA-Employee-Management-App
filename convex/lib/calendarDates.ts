/**
 * Calendar-date helpers for server-side analytics (Convex runs in UTC).
 *
 * Pepl is operated in South Africa (SAST, UTC+2, no DST). User-facing date pickers
 * use calendar days (YYYY-MM-DD), not UTC midnight. See also src/lib/dateUtils.ts.
 *
 * Do not use Date.UTC(y, m, d) alone for bucket boundaries — that shifts the day
 * for SAST users. Use these helpers for billing trends and any day-bucketed reports.
 */

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

function parseParts(dateStr: string): { y: number; m: number; d: number } {
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return { y, m, d };
}

/** Start of calendar day in SAST (00:00:00.000). */
export function startOfSastDayFromDateStr(dateStr: string): number {
  const { y, m, d } = parseParts(dateStr);
  return Date.UTC(y, m - 1, d, 0, 0, 0, 0) - SAST_OFFSET_MS;
}

/** End of calendar day in SAST (23:59:59.999). */
export function endOfSastDayFromDateStr(dateStr: string): number {
  const { y, m, d } = parseParts(dateStr);
  return Date.UTC(y, m - 1, d, 23, 59, 59, 999) - SAST_OFFSET_MS;
}

/** Start of the SAST calendar day containing `ms`. */
export function startOfSastDay(ms: number): number {
  const shifted = ms + SAST_OFFSET_MS;
  const d = new Date(shifted);
  return (
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0) -
    SAST_OFFSET_MS
  );
}

/** Start of the SAST calendar month containing `ms`. */
export function startOfSastMonth(ms: number): number {
  const shifted = ms + SAST_OFFSET_MS;
  const d = new Date(shifted);
  return (
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0) - SAST_OFFSET_MS
  );
}

/** YYYY-MM-DD in SAST for comparing with date-picker values. */
export function toSastDateString(ms: number): string {
  const shifted = ms + SAST_OFFSET_MS;
  const d = new Date(shifted);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatSastDayLabel(ms: number): string {
  const shifted = ms + SAST_OFFSET_MS;
  const d = new Date(shifted);
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatSastMonthLabel(ms: number): string {
  const shifted = ms + SAST_OFFSET_MS;
  const d = new Date(shifted);
  return d.toLocaleDateString("en-ZA", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildSastBuckets(
  startDate: string,
  endDate: string,
  granularity: "day" | "month"
): { startMs: number; endMs: number; label: string }[] {
  const rangeStart = startOfSastDayFromDateStr(startDate);
  const rangeEnd = endOfSastDayFromDateStr(endDate);

  if (rangeEnd < rangeStart) {
    throw new Error("End date must be on or after start date");
  }

  const buckets: { startMs: number; endMs: number; label: string }[] = [];
  let cursor =
    granularity === "month"
      ? startOfSastMonth(rangeStart)
      : startOfSastDay(rangeStart);
  const endCursor =
    granularity === "month" ? startOfSastMonth(rangeEnd) : startOfSastDay(rangeEnd);

  while (cursor <= endCursor) {
    const next =
      granularity === "month"
        ? (() => {
            const shifted = cursor + SAST_OFFSET_MS;
            const d = new Date(shifted);
            return (
              Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0) -
              SAST_OFFSET_MS
            );
          })()
        : cursor + 24 * 60 * 60 * 1000;

    buckets.push({
      startMs: cursor,
      endMs: next - 1,
      label:
        granularity === "month"
          ? formatSastMonthLabel(cursor)
          : formatSastDayLabel(cursor),
    });
    cursor = next;
  }

  return buckets;
}

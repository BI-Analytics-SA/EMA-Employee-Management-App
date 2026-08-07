/**
 * Calendar date utilities for `<input type="date">` and display.
 *
 * **Why this exists:** Parsing `YYYY-MM-DD` with `Date.UTC(...)` or `new Date(str)`
 * treats midnight as UTC and shifts the day in South Africa (UTC+2). Always use
 * `parseLocalDate` / `formatDateInput` in the browser for form fields.
 *
 * **Server (Convex):** Day-bucketed analytics use `convex/lib/calendarDates.ts`
 * (SAST) and accept `YYYY-MM-DD` strings — do not bucket by UTC day on timestamps
 * sent from the client.
 */

/** Strictly year-first: 4-digit year, then month, then day. */
const LOCAL_DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/**
 * Parse a YYYY-MM-DD string as local midnight, avoiding UTC offset day-shift.
 * Returns the timestamp in ms, or undefined if the string is empty or invalid.
 *
 * Rejects anything that is not year-first. A day-first string like "26-03-2026"
 * would otherwise be read as year 26, silently storing a date in the 1930s.
 * Also rejects non-existent days such as "2026-02-30".
 */
export function parseLocalDate(dateStr: string): number | undefined {
  const match = dateStr.trim().match(LOCAL_DATE_RE);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const d = new Date(year, month - 1, day);
  // Round-trip check: JS rolls invalid days over into the next month
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return undefined;
  }
  const ts = d.getTime();
  return Number.isNaN(ts) ? undefined : ts;
}

/**
 * Format a timestamp as a YYYY-MM-DD string using local time, suitable for
 * <input type="date"> value props. Returns "" for falsy input.
 */
export function formatDateInput(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

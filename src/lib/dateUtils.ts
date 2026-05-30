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

/**
 * Parse a YYYY-MM-DD string as local midnight, avoiding UTC offset day-shift.
 * Returns the timestamp in ms, or undefined if the string is empty or invalid.
 */
export function parseLocalDate(dateStr: string): number | undefined {
  if (!dateStr.trim()) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return undefined;
  const ts = new Date(year, month - 1, day).getTime();
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

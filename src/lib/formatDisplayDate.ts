type DisplayDate = number | string | Date | null | undefined;
type DisplayDateOptions = {
  /** Preserve the caller's calendar convention. Omit for browser-local time. */
  timeZone?: string;
  /** Some existing UI sites hide missing values instead of showing an em dash. */
  fallback?: string;
};

/** Display only. Never use for inputs, storage, imports, exports or contracts. */
function formatDisplay(value: DisplayDate, includeTime: boolean, options: DisplayDateOptions): string {
  const fallback = options.fallback ?? "—";
  if (value == null || (typeof value === "string" && !value.trim())) return fallback;

  let date: Date;
  let timeZone = options.timeZone;
  const calendarDate = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim()) : null;
  if (calendarDate) {
    // A date-only string is a calendar day, not a UTC instant. Construct and
    // validate its parts without allowing the browser's timezone to shift it.
    const [, year, month, day] = calendarDate.map(Number);
    date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return fallback;
    }
    timeZone = "UTC";
  } else {
    date = value instanceof Date ? value : new Date(value);
  }
  if (Number.isNaN(date.getTime())) return fallback;

  const parts = new Intl.DateTimeFormat("en-GB", {
    calendar: "gregory", numberingSystem: "latn",
    year: "numeric", month: "2-digit", day: "2-digit", timeZone,
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } as const : {}),
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const day = `${part("year").padStart(4, "0")}/${part("month")}/${part("day")}`;
  return includeTime ? `${day} ${part("hour")}:${part("minute")}` : day;
}

/** yyyy/mm/dd; timestamps/ISO instants keep their existing local day by default. */
export function formatDisplayDate(value: DisplayDate, options: DisplayDateOptions = {}): string {
  return formatDisplay(value, false, options);
}

/** yyyy/mm/dd HH:mm with a 24-hour clock and the same calendar rules. */
export function formatDisplayDateTime(value: DisplayDate, options: DisplayDateOptions = {}): string {
  return formatDisplay(value, true, options);
}

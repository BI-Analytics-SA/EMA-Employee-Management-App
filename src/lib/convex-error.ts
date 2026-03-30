import { ConvexError } from "convex/values";

/**
 * Extract a user-friendly error message from a Convex mutation error.
 *
 * Handles:
 * 1. ConvexError with string data (preferred path — use ConvexError in mutations for user-facing messages)
 * 2. All other errors (returns fallback — plain Error messages are not transmitted by Convex)
 */
export function extractConvexError(e: unknown, fallback: string): string {
  if (e instanceof ConvexError) {
    return typeof e.data === "string" ? e.data : fallback;
  }
  // instanceof can fail when the bundler resolves multiple copies of convex/values.
  // ConvexError always carries a `data` property; standard Error never does.
  if (e instanceof Error && "data" in e) {
    const data = (e as Error & { data: unknown }).data;
    return typeof data === "string" ? data : fallback;
  }
  return fallback;
}

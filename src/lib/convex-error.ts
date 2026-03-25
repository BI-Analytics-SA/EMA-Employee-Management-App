import { ConvexError } from "convex/values";

/**
 * Extract a user-friendly error message from a Convex mutation error.
 *
 * Handles:
 * 1. ConvexError with string data (preferred path)
 * 2. Plain Error with Convex-prefixed message (legacy fallback)
 * 3. Unknown error types (returns fallback)
 */
export function extractConvexError(e: unknown, fallback: string): string {
  if (e instanceof ConvexError) {
    return typeof e.data === "string" ? e.data : fallback;
  }
  if (e instanceof Error) {
    const match = e.message.match(/Uncaught Error:\s*(.+)/);
    return match?.[1] ?? e.message;
  }
  return fallback;
}

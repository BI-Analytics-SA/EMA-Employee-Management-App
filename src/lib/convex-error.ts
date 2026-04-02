import { ConvexError } from "convex/values";

/**
 * Extract a user-friendly error message from a Convex mutation error.
 *
 * Handles:
 * 1. ConvexError with string data (preferred path — use ConvexError in mutations for user-facing messages)
 * 2. All other errors (returns fallback — plain Error messages are not transmitted by Convex)
 */
export function extractConvexError(e: unknown, fallback: string): string {
  console.debug("[ConvexError diagnostic]", {
    raw: e,
    type: typeof e,
    isConvexError: e instanceof ConvexError,
    isError: e instanceof Error,
    message: e instanceof Error ? e.message : undefined,
    data: e != null && typeof e === "object" && "data" in e ? (e as { data: unknown }).data : undefined,
    constructor: e != null && typeof e === "object" ? e.constructor?.name : undefined,
  });
  if (e instanceof ConvexError) {
    return typeof e.data === "string" ? e.data : fallback;
  }
  if (e instanceof Error) {
    const match = e.message.match(/Uncaught Error:\s*(.+)/);
    // Return fallback if no match — prevents raw Convex envelopes leaking to the UI
    return match?.[1] ?? fallback;
  }
  return fallback;
}

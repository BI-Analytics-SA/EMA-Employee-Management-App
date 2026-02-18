import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserId } from "../lib/permissions";

/**
 * Get saved column IDs for a report for the current user.
 * Returns null if no preferences saved (caller should use default columns).
 */
export const getReportColumnPreferences = query({
  args: {
    reportId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const row = await ctx.db
      .query("reportColumnPreferences")
      .withIndex("by_user_report", (q) =>
        q.eq("userId", userId).eq("reportId", args.reportId)
      )
      .first();
    return row?.columnIds ?? null;
  },
});

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserId } from "../lib/permissions";

/**
 * Save column IDs for a report for the current user.
 */
export const setReportColumnPreferences = mutation({
  args: {
    reportId: v.string(),
    columnIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const existing = await ctx.db
      .query("reportColumnPreferences")
      .withIndex("by_user_report", (q) =>
        q.eq("userId", userId).eq("reportId", args.reportId)
      )
      .first();

    const updatedAt = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        columnIds: args.columnIds,
        updatedAt,
      });
      return existing._id;
    }
    return await ctx.db.insert("reportColumnPreferences", {
      userId,
      reportId: args.reportId,
      columnIds: args.columnIds,
      updatedAt,
    });
  },
});

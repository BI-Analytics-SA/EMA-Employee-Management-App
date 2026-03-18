import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrganizationAccess, requireModuleEnabled } from "../lib/permissions";

/**
 * List all documents for a job.
 */
export const listByJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return [];
    }
    await requireOrganizationAccess(ctx, job.organizationId);
    await requireModuleEnabled(ctx, job.organizationId, "jobs");

    return await ctx.db
      .query("jobDocuments")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single job document by ID.
 */
export const getById = query({
  args: { id: v.id("jobDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      return null;
    }
    await requireOrganizationAccess(ctx, doc.organizationId);
    await requireModuleEnabled(ctx, doc.organizationId, "jobs");
    return doc;
  },
});

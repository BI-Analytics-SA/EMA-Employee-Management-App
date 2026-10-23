import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrganizationAccess, requireModuleEnabled } from "../lib/permissions";

/**
 * List all jobs for an organization.
 */
export const listByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const profile = await requireOrganizationAccess(ctx, args.organizationId);
    await requireModuleEnabled(ctx, profile.organizationId, "jobs");

    return await ctx.db
      .query("jobs")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single job by ID.
 */
export const getById = query({
  // Route params are untrusted strings; malformed IDs are missing records.
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("jobs", args.id);
    if (!id) return null;
    const job = await ctx.db.get(id);
    if (!job) {
      return null;
    }
    await requireOrganizationAccess(ctx, job.organizationId);
    await requireModuleEnabled(ctx, job.organizationId, "jobs");
    return job;
  },
});

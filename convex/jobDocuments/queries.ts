import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrganizationAccess, requireModuleEnabled } from "../lib/permissions";

/**
 * List all documents for a job.
 */
export const listByJob = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const jobId = ctx.db.normalizeId("jobs", args.jobId);
    if (!jobId) return [];
    const job = await ctx.db.get(jobId);
    if (!job) {
      return [];
    }
    await requireOrganizationAccess(ctx, job.organizationId);
    await requireModuleEnabled(ctx, job.organizationId, "jobs");

    return await ctx.db
      .query("jobDocuments")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single job document by ID.
 */
export const getById = query({
  // Route params are untrusted strings; malformed IDs are missing records.
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("jobDocuments", args.id);
    if (!id) return null;
    const doc = await ctx.db.get(id);
    if (!doc) {
      return null;
    }
    await requireOrganizationAccess(ctx, doc.organizationId);
    await requireModuleEnabled(ctx, doc.organizationId, "jobs");
    return doc;
  },
});

/**
 * Get expiring job documents for an organization (within daysAhead window or already expired).
 */
export const getExpiringByOrganization = query({
  args: {
    organizationId: v.id("organizations"),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);
    await requireModuleEnabled(ctx, args.organizationId, "jobs");

    const daysAhead = args.daysAhead ?? 90;
    const cutoff = Date.now() + daysAhead * 24 * 60 * 60 * 1000;

    const docs = await ctx.db
      .query("jobDocuments")
      .withIndex("by_organization_expiry", (q) =>
        q.eq("organizationId", args.organizationId).lte("expiryDate", cutoff)
      )
      .collect();

    // Filter out documents with no expiry (undefined sorts before numbers in the index)
    return docs.filter((d) => d.expiryDate != null);
  },
});

/**
 * Get expiring job documents with their parent job info.
 */
export const getExpiringWithJobs = query({
  args: {
    organizationId: v.id("organizations"),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);
    await requireModuleEnabled(ctx, args.organizationId, "jobs");

    const daysAhead = args.daysAhead ?? 90;
    const cutoff = Date.now() + daysAhead * 24 * 60 * 60 * 1000;

    const docs = await ctx.db
      .query("jobDocuments")
      .withIndex("by_organization_expiry", (q) =>
        q.eq("organizationId", args.organizationId).lte("expiryDate", cutoff)
      )
      .collect();

    const expiring = docs.filter((d) => d.expiryDate != null);

    const results = await Promise.all(
      expiring.map(async (doc) => {
        const job = await ctx.db.get(doc.jobId);
        if (!job) return null;
        return { document: doc, job };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

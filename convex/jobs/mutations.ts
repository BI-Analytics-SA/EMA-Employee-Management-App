import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRoleInOrganization, requireModuleEnabled } from "../lib/permissions";

const jobStatusValidator = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);

/**
 * Create a new job.
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    status: jobStatusValidator,
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await requireRoleInOrganization(ctx, args.organizationId, "user");
    await requireModuleEnabled(ctx, args.organizationId, "jobs");

    if (args.startDate !== undefined && args.endDate !== undefined && args.endDate < args.startDate) {
      throw new Error("End date cannot be before start date");
    }

    const now = Date.now();
    return await ctx.db.insert("jobs", {
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      status: args.status,
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
      createdBy: profile._id,
    });
  },
});

/**
 * Update a job's fields.
 */
export const update = mutation({
  args: {
    id: v.id("jobs"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(jobStatusValidator),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const job = await ctx.db.get(id);
    if (!job) {
      throw new Error("Job not found");
    }

    await requireRoleInOrganization(ctx, job.organizationId, "user");
    await requireModuleEnabled(ctx, job.organizationId, "jobs");

    const newStart = updates.startDate ?? job.startDate;
    const newEnd = updates.endDate ?? job.endDate;
    if (newStart !== undefined && newEnd !== undefined && newEnd < newStart) {
      throw new Error("End date cannot be before start date");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.startDate !== undefined) patch.startDate = updates.startDate;
    if (updates.endDate !== undefined) patch.endDate = updates.endDate;

    await ctx.db.patch(id, patch as Record<string, never>);
    return id;
  },
});

/**
 * Delete a job and all its documents.
 */
export const remove = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) {
      throw new Error("Job not found");
    }

    await requireRoleInOrganization(ctx, job.organizationId, "user");
    await requireModuleEnabled(ctx, job.organizationId, "jobs");

    // Delete all job documents and their storage files
    const jobDocs = await ctx.db
      .query("jobDocuments")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .collect();

    for (const doc of jobDocs) {
      try {
        await ctx.storage.delete(doc.storageId);
      } catch {
        console.error(`Failed to delete storage for jobDocument ${doc._id}`);
      }
      await ctx.db.delete(doc._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

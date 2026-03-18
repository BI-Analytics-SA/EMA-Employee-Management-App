import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRoleInOrganization, requireModuleEnabled } from "../lib/permissions";

/**
 * Create a job document record after file has been uploaded to storage.
 */
export const create = mutation({
  args: {
    jobId: v.id("jobs"),
    documentType: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSizeBytes: v.number(),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    issuedBy: v.optional(v.string()),
    issuedDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const profile = await requireRoleInOrganization(ctx, job.organizationId, "user");
    await requireModuleEnabled(ctx, job.organizationId, "jobs");

    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new Error("Failed to get file URL");
    }

    const now = Date.now();
    return await ctx.db.insert("jobDocuments", {
      organizationId: job.organizationId,
      jobId: args.jobId,
      documentType: args.documentType,
      storageId: args.storageId,
      fileUrl,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSizeBytes: args.fileSizeBytes,
      title: args.title,
      notes: args.notes,
      issuedBy: args.issuedBy,
      issuedDate: args.issuedDate,
      expiryDate: args.expiryDate,
      createdAt: now,
      createdBy: profile._id,
    });
  },
});

/**
 * Update job document metadata.
 */
export const update = mutation({
  args: {
    id: v.id("jobDocuments"),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    issuedBy: v.optional(v.string()),
    issuedDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const doc = await ctx.db.get(id);
    if (!doc) {
      throw new Error("Document not found");
    }

    await requireRoleInOrganization(ctx, doc.organizationId, "user");
    await requireModuleEnabled(ctx, doc.organizationId, "jobs");

    const patch: Record<string, unknown> = {};
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.issuedBy !== undefined) patch.issuedBy = updates.issuedBy;
    if (updates.issuedDate !== undefined) patch.issuedDate = updates.issuedDate;
    if (updates.expiryDate !== undefined) patch.expiryDate = updates.expiryDate;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch as Record<string, never>);
    }
    return id;
  },
});

/**
 * Delete a job document and its file from storage.
 */
export const remove = mutation({
  args: { id: v.id("jobDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Document not found");
    }

    await requireRoleInOrganization(ctx, doc.organizationId, "user");
    await requireModuleEnabled(ctx, doc.organizationId, "jobs");

    try {
      await ctx.storage.delete(doc.storageId);
    } catch {
      console.error(`Failed to delete storage for jobDocument ${args.id}`);
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

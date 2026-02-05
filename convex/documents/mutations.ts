import { mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  requireRoleInOrganization,
  canManageEmployees,
} from "../lib/permissions";

/**
 * Create a document record after file has been uploaded to storage.
 */
export const create = mutation({
  args: {
    employeeId: v.id("employees"),
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
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const profile = await requireRoleInOrganization(
      ctx,
      employee.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot add documents");
    }

    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new Error("Failed to get file URL");
    }

    const now = Date.now();
    return await ctx.db.insert("employeeDocuments", {
      organizationId: employee.organizationId,
      employeeId: args.employeeId,
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
 * Update document metadata (title, notes, issuedBy, issuedDate, expiryDate).
 */
export const update = mutation({
  args: {
    id: v.id("employeeDocuments"),
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

    const profile = await requireRoleInOrganization(
      ctx,
      doc.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot edit documents");
    }

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
 * Delete a document and its file from storage.
 */
export const remove = mutation({
  args: { id: v.id("employeeDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Document not found");
    }

    const profile = await requireRoleInOrganization(
      ctx,
      doc.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot delete documents");
    }

    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(args.id);
    return args.id;
  },
});

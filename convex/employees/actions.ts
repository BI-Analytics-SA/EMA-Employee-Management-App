import { mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  requireRoleInOrganization,
  canManageEmployees,
  getAuthenticatedUserProfile,
} from "../lib/permissions";

/**
 * Generate a signed upload URL for employee image upload.
 * Caller must be authenticated.
 */
export const generateImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUserProfile(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save uploaded image to employee record. Replaces existing image if any.
 * Verifies organization access and canManageEmployees.
 */
export const saveEmployeeImage = mutation({
  args: {
    employeeId: v.id("employees"),
    storageId: v.id("_storage"),
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
      throw new Error("Access denied: You cannot update employee photos");
    }

    if (employee.imageStorageId) {
      await ctx.storage.delete(employee.imageStorageId);
    }

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    await ctx.db.patch(args.employeeId, {
      imageStorageId: args.storageId,
      imageUrl: imageUrl ?? undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Remove image from employee and delete from storage.
 */
export const deleteEmployeeImage = mutation({
  args: { employeeId: v.id("employees") },
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
      throw new Error("Access denied: You cannot delete employee photos");
    }

    if (employee.imageStorageId) {
      await ctx.storage.delete(employee.imageStorageId);
    }

    await ctx.db.patch(args.employeeId, {
      imageStorageId: undefined,
      imageUrl: undefined,
      updatedAt: Date.now(),
    });
  },
});

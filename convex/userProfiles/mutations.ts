import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Update the current user's profile
 */
export const updateCurrentProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const updates: { name?: string; lastLoginAt: number } = {
      lastLoginAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    await ctx.db.patch(profile._id, updates);

    return { success: true };
  },
});

/**
 * Update a user's role (admin only)
 */
export const updateRole = mutation({
  args: {
    profileId: v.id("userProfiles"),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("user")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the target profile
    const targetProfile = await ctx.db.get(args.profileId);
    if (!targetProfile) {
      throw new Error("User profile not found");
    }

    // Verify current user is admin of the same organization
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", targetProfile.organizationId)
      )
      .first();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new ConvexError("Only admins can change user roles");
    }

    // Prevent demoting yourself if you're the only admin
    if (targetProfile._id === currentProfile._id && args.role !== "admin") {
      const adminCount = await ctx.db
        .query("userProfiles")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", targetProfile.organizationId)
        )
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      if (adminCount.length <= 1) {
        throw new ConvexError("Cannot demote the only admin. Promote another user to admin first.");
      }
    }

    await ctx.db.patch(args.profileId, { role: args.role });

    return { success: true };
  },
});

/**
 * Deactivate a user (admin only)
 */
export const deactivateUser = mutation({
  args: {
    profileId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the target profile
    const targetProfile = await ctx.db.get(args.profileId);
    if (!targetProfile) {
      throw new Error("User profile not found");
    }

    // Verify current user is admin of the same organization
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", targetProfile.organizationId)
      )
      .first();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new ConvexError("Only admins can deactivate users");
    }

    // Prevent deactivating yourself
    if (targetProfile._id === currentProfile._id) {
      throw new ConvexError("You cannot deactivate your own account");
    }

    await ctx.db.patch(args.profileId, { isActive: false });

    return { success: true };
  },
});

/**
 * Reactivate a user (admin only)
 */
export const reactivateUser = mutation({
  args: {
    profileId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the target profile
    const targetProfile = await ctx.db.get(args.profileId);
    if (!targetProfile) {
      throw new Error("User profile not found");
    }

    // Verify current user is admin of the same organization
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", targetProfile.organizationId)
      )
      .first();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new ConvexError("Only admins can reactivate users");
    }

    await ctx.db.patch(args.profileId, { isActive: true });

    return { success: true };
  },
});

/**
 * Permanently delete a user profile (admin only)
 * Cannot delete yourself or the last admin. Auth user record is not removed.
 */
export const deleteUser = mutation({
  args: {
    profileId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const targetProfile = await ctx.db.get(args.profileId);
    if (!targetProfile) {
      throw new Error("User profile not found");
    }

    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", targetProfile.organizationId)
      )
      .first();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new ConvexError("Only admins can delete users");
    }

    if (targetProfile._id === currentProfile._id) {
      throw new ConvexError("You cannot delete your own account");
    }

    if (targetProfile.role === "admin") {
      const adminCount = await ctx.db
        .query("userProfiles")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", targetProfile.organizationId)
        )
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      if (adminCount.length <= 1) {
        throw new ConvexError("Cannot delete the only admin. Promote another user to admin first.");
      }
    }

    await ctx.db.delete(args.profileId);
    return { success: true };
  },
});

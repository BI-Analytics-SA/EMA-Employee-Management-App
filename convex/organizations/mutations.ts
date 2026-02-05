import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new organization
 * Also creates a userProfile for the creating user as admin
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user already has a profile (already belongs to an org)
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      throw new Error("You already belong to an organization");
    }

    // Check if slug is already taken
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existingOrg) {
      throw new Error("An organization with this URL already exists. Please choose a different one.");
    }

    // Get the user's email for the profile name
    const user = await ctx.db.get(userId);
    const userName = user?.name || user?.email || "Admin";

    // Create the organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug.toLowerCase(),
      createdAt: Date.now(),
    });

    // Create the user's profile as admin of this organization
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      organizationId,
      name: userName,
      role: "admin",
      isActive: true,
      createdAt: Date.now(),
    });

    return { organizationId, profileId };
  },
});

/**
 * Update organization settings
 */
export const updateSettings = mutation({
  args: {
    organizationId: v.id("organizations"),
    settings: v.object({
      departments: v.array(v.string()),
      deptGroups: v.array(v.string()),
      shifts: v.array(v.string()),
      shiftAllocations: v.array(v.string()),
      suburbs: v.array(v.string()),
      cities: v.array(v.string()),
      postCodes: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify user is admin of this organization
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Only organization admins can update settings");
    }

    await ctx.db.patch(args.organizationId, {
      settings: args.settings,
    });

    return { success: true };
  },
});

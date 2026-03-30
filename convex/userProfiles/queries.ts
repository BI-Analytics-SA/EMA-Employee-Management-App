import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the current user's profile
 * Returns null if user is not authenticated or has no profile
 */
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Get the current user's profile for a specific organization.
 * Returns null if not authenticated or not a member of that org.
 */
export const getProfileForOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();
  },
});

/**
 * Get all organizations the current user belongs to (profile + org for each).
 * Used by the org switcher.
 */
export const getMyOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const result = await Promise.all(
      profiles
        .filter((p) => p.isActive)
        .map(async (profile) => {
          const organization = await ctx.db.get(profile.organizationId);
          return organization
            ? { profile, organization }
            : null;
        })
    );

    return result.filter((x): x is NonNullable<typeof x> => x !== null);
  },
});

/**
 * Get a user profile by ID
 */
export const getById = query({
  args: { id: v.id("userProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all user profiles for an organization with email addresses
 */
export const listByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify user belongs to this organization
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();

    if (!currentProfile) {
      throw new ConvexError("Access denied");
    }

    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Join with auth users table for email
    const withEmails = await Promise.all(
      profiles.map(async (profile) => {
        const authUser = await ctx.db.get(profile.userId);
        return {
          ...profile,
          email: authUser?.email ?? null,
        };
      })
    );

    return withEmails;
  },
});

/**
 * Check if the current user has completed onboarding (has a profile)
 */
export const hasCompletedOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !!profile;
  },
});

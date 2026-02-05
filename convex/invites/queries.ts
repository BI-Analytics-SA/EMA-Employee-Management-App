import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get an invite by its code (public - used during onboarding)
 * Only returns active (pending, non-expired) invites
 */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!invite) {
      return null;
    }

    // Check if invite is still valid
    if (invite.status !== "pending") {
      return null;
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return null;
    }

    // Get organization details
    const organization = await ctx.db.get(invite.organizationId);

    return {
      code: invite.code,
      role: invite.role,
      email: invite.email, // Include email so it can be pre-filled on sign-up
      organizationId: invite.organizationId,
      organizationName: organization?.name || "Unknown Organization",
    };
  },
});

/**
 * List all invites for an organization (admin only)
 */
export const listByOrganization = query({
  args: { organizationId: v.id("organizations") },
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
      throw new Error("Only admins can view invites");
    }

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    // Get creator names
    const invitesWithCreators = await Promise.all(
      invites.map(async (invite) => {
        const creator = await ctx.db.get(invite.createdBy);
        const usedByProfile = invite.usedBy ? await ctx.db.get(invite.usedBy) : null;

        // Check if expired
        const isExpired = invite.expiresAt && invite.expiresAt < Date.now();
        const effectiveStatus = isExpired && invite.status === "pending" ? "expired" : invite.status;

        return {
          ...invite,
          creatorName: creator?.name || "Unknown",
          usedByName: usedByProfile?.name || null,
          effectiveStatus,
        };
      })
    );

    return invitesWithCreators;
  },
});

/**
 * Get invite details for sending email (internal use by action)
 */
export const getInviteForEmail = query({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      return null;
    }

    const organization = await ctx.db.get(invite.organizationId);
    const inviter = await ctx.db.get(invite.createdBy);

    return {
      code: invite.code,
      email: invite.email,
      role: invite.role,
      organizationName: organization?.name || "Unknown Organization",
      inviterName: inviter?.name || "A team member",
    };
  },
});

/**
 * Get pending invite count for an organization
 */
export const getPendingCount = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    // Verify user belongs to this organization
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();

    if (!profile) {
      return 0;
    }

    const pendingInvites = await ctx.db
      .query("invites")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", "pending")
      )
      .collect();

    // Filter out expired ones
    const validInvites = pendingInvites.filter(
      (invite) => !invite.expiresAt || invite.expiresAt > Date.now()
    );

    return validInvites.length;
  },
});

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Generate a random invite code
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (0, O, 1, I)
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new invite (admin only)
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("nurse"),
      v.literal("user")
    ),
    email: v.optional(v.string()),
    expiresInDays: v.optional(v.number()),
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
      throw new Error("Only admins can create invites");
    }

    // Generate unique code
    let code = generateInviteCode();
    let existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    // Regenerate if code already exists (very unlikely)
    while (existingInvite) {
      code = generateInviteCode();
      existingInvite = await ctx.db
        .query("invites")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
    }

    // Calculate expiry
    const expiresAt = args.expiresInDays
      ? Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    const inviteId = await ctx.db.insert("invites", {
      organizationId: args.organizationId,
      code,
      email: args.email,
      role: args.role,
      status: "pending",
      expiresAt,
      createdAt: Date.now(),
      createdBy: profile._id,
    });

    return { inviteId, code };
  },
});

/**
 * Revoke an invite (admin only)
 */
export const revoke = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    // Verify user is admin of this organization
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", invite.organizationId)
      )
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Only admins can revoke invites");
    }

    if (invite.status !== "pending") {
      throw new Error("Can only revoke pending invites");
    }

    await ctx.db.patch(args.inviteId, { status: "revoked" });

    return { success: true };
  },
});

/**
 * Use an invite to join an organization
 * Called during onboarding when user has an invite code
 */
export const useInvite = mutation({
  args: {
    code: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user already has a profile
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      throw new Error("You already belong to an organization");
    }

    // Find the invite
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!invite) {
      throw new Error("Invalid invite code");
    }

    if (invite.status !== "pending") {
      throw new Error("This invite is no longer valid");
    }

    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      // Mark as expired
      await ctx.db.patch(invite._id, { status: "expired" });
      throw new Error("This invite has expired");
    }

    // If invite has a specific email, verify it matches
    if (invite.email) {
      const user = await ctx.db.get(userId);
      if (user?.email?.toLowerCase() !== invite.email.toLowerCase()) {
        throw new Error("This invite was sent to a different email address");
      }
    }

    // Create the user profile
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      organizationId: invite.organizationId,
      name: args.userName,
      role: invite.role,
      isActive: true,
      createdAt: Date.now(),
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      status: "used",
      usedBy: profileId,
      usedAt: Date.now(),
    });

    return { profileId, organizationId: invite.organizationId };
  },
});

/**
 * Mark invite as email sent (called by action after sending)
 */
export const markEmailSent = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.inviteId, {
      emailSentAt: Date.now(),
    });
    return { success: true };
  },
});

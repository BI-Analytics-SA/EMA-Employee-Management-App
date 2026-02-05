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

const documentTypeValidator = v.object({
  id: v.string(),
  name: v.string(),
  requiresExpiry: v.boolean(),
  color: v.optional(v.string()),
});

/** Build full settings object so required arrays are never undefined when patching. */
function mergeSettings(
  existing: { departments?: string[]; deptGroups?: string[]; shifts?: string[]; shiftAllocations?: string[]; suburbs?: string[]; cities?: string[]; postCodes?: string[]; documentTypes?: { id: string; name: string; requiresExpiry: boolean; color?: string }[] } | undefined,
  override: { documentTypes: { id: string; name: string; requiresExpiry: boolean; color?: string }[] }
) {
  const s = existing ?? {};
  return {
    departments: s.departments ?? [],
    deptGroups: s.deptGroups ?? [],
    shifts: s.shifts ?? [],
    shiftAllocations: s.shiftAllocations ?? [],
    suburbs: s.suburbs ?? [],
    cities: s.cities ?? [],
    postCodes: s.postCodes ?? [],
    documentTypes: override.documentTypes,
  };
}

/**
 * Add a document type to organization settings (admin only).
 */
export const addDocumentType = mutation({
  args: {
    organizationId: v.id("organizations"),
    documentType: documentTypeValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Only organization admins can manage document types");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const currentTypes = org.settings?.documentTypes ?? [];
    const existing = currentTypes.find((t) => t.id === args.documentType.id);
    if (existing) {
      throw new Error("A document type with this ID already exists");
    }

    const newTypes = [...currentTypes, args.documentType];
    await ctx.db.patch(args.organizationId, {
      settings: mergeSettings(org.settings, { documentTypes: newTypes }),
    });

    return { success: true };
  },
});

/**
 * Update an existing document type (admin only).
 */
export const updateDocumentType = mutation({
  args: {
    organizationId: v.id("organizations"),
    id: v.string(),
    name: v.optional(v.string()),
    requiresExpiry: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Only organization admins can manage document types");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const currentTypes = org.settings?.documentTypes ?? [];
    const index = currentTypes.findIndex((t) => t.id === args.id);
    if (index === -1) {
      throw new Error("Document type not found");
    }

    const updated = { ...currentTypes[index] };
    if (args.name !== undefined) updated.name = args.name;
    if (args.requiresExpiry !== undefined) updated.requiresExpiry = args.requiresExpiry;
    if (args.color !== undefined) updated.color = args.color;

    const newTypes = [...currentTypes];
    newTypes[index] = updated;

    await ctx.db.patch(args.organizationId, {
      settings: mergeSettings(org.settings, { documentTypes: newTypes }),
    });

    return { success: true };
  },
});

/**
 * Remove a document type from organization settings (admin only).
 * Does not delete existing documents of that type.
 */
export const removeDocumentType = mutation({
  args: {
    organizationId: v.id("organizations"),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();

    if (!profile || profile.role !== "admin") {
      throw new Error("Only organization admins can manage document types");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const currentTypes = org.settings?.documentTypes ?? [];
    const newTypes = currentTypes.filter((t) => t.id !== args.id);

    if (newTypes.length === currentTypes.length) {
      throw new Error("Document type not found");
    }

    await ctx.db.patch(args.organizationId, {
      settings: mergeSettings(org.settings, { documentTypes: newTypes }),
    });

    return { success: true };
  },
});

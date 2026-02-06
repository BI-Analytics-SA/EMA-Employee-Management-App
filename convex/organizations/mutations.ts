import { mutation } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireRole } from "../lib/permissions";

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

/** Build full settings object with required arrays and updated enabledModules. */
function mergeSettingsWithModules(
  existing:
    | {
        departments?: string[];
        deptGroups?: string[];
        shifts?: string[];
        shiftAllocations?: string[];
        suburbs?: string[];
        cities?: string[];
        postCodes?: string[];
        documentTypes?: { id: string; name: string; requiresExpiry: boolean; color?: string }[];
        enabledModules?: { contracts?: boolean; medical?: boolean };
      }
    | undefined,
  enabledModules: { contracts?: boolean; medical?: boolean }
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
    documentTypes: s.documentTypes,
    enabledModules,
  };
}

/**
 * Toggle an add-on module for the organization (admin only).
 */
export const toggleModule = mutation({
  args: {
    moduleName: v.union(v.literal("contracts"), v.literal("medical")),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, "admin");
    const org = await ctx.db.get(profile.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }
    const currentModules = org.settings?.enabledModules ?? {};
    const newEnabledModules = {
      ...currentModules,
      [args.moduleName]: args.enabled,
    };
    const newSettings = mergeSettingsWithModules(org.settings, newEnabledModules);
    await ctx.db.patch(profile.organizationId, {
      settings: newSettings,
    });
    return { success: true };
  },
});

const contractTemplateValidator = v.object({
  companyName: v.optional(v.string()),
  contractHeading: v.optional(v.string()),
  contractCategory: v.optional(v.string()),
  defaultTermsAndConditions: v.optional(v.string()),
});

/**
 * Update contract template defaults for the organization (admin only).
 */
export const updateContractTemplate = mutation({
  args: {
    organizationId: v.id("organizations"),
    contractTemplate: contractTemplateValidator,
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
      throw new Error("Only organization admins can update contract template");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const current = org.settings?.contractTemplate ?? {};
    const newTemplate = {
      companyName:
        args.contractTemplate.companyName !== undefined
          ? args.contractTemplate.companyName
          : current.companyName,
      contractHeading:
        args.contractTemplate.contractHeading !== undefined
          ? args.contractTemplate.contractHeading
          : current.contractHeading,
      contractCategory:
        args.contractTemplate.contractCategory !== undefined
          ? args.contractTemplate.contractCategory
          : current.contractCategory,
      defaultTermsAndConditions:
        args.contractTemplate.defaultTermsAndConditions !== undefined
          ? args.contractTemplate.defaultTermsAndConditions
          : current.defaultTermsAndConditions,
      employerSignatureStorageId: (current as { employerSignatureStorageId?: Id<"_storage"> }).employerSignatureStorageId,
      employerSignatureUrl: (current as { employerSignatureUrl?: string }).employerSignatureUrl,
    };

    const s = org.settings;
    type OrgSettings = NonNullable<Doc<"organizations">["settings"]>;
    const newSettings = {
      departments: s?.departments ?? [],
      deptGroups: s?.deptGroups ?? [],
      shifts: s?.shifts ?? [],
      shiftAllocations: s?.shiftAllocations ?? [],
      suburbs: s?.suburbs ?? [],
      cities: s?.cities ?? [],
      postCodes: s?.postCodes ?? [],
      documentTypes: s?.documentTypes,
      enabledModules: s?.enabledModules,
      contractTemplate: newTemplate,
      exportConfig: s?.exportConfig,
    };
    await ctx.db.patch(args.organizationId, {
      settings: newSettings as unknown as OrgSettings,
    });

    return { success: true };
  },
});

const exportColumnValidator = v.object({
  id: v.string(),
  source: v.union(v.literal("database"), v.literal("custom")),
  dbField: v.optional(v.string()),
  label: v.string(),
  dataType: v.union(v.literal("text"), v.literal("number"), v.literal("date")),
  defaultValue: v.optional(v.string()),
  enabled: v.boolean(),
});

/**
 * Update organization export config (column definitions for Excel export). Admin only.
 */
export const updateExportConfig = mutation({
  args: {
    organizationId: v.id("organizations"),
    columns: v.array(exportColumnValidator),
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
      throw new Error("Only organization admins can update export configuration");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const s = org.settings;
    type OrgSettings = NonNullable<Doc<"organizations">["settings"]>;
    const newSettings = {
      departments: s?.departments ?? [],
      deptGroups: s?.deptGroups ?? [],
      shifts: s?.shifts ?? [],
      shiftAllocations: s?.shiftAllocations ?? [],
      suburbs: s?.suburbs ?? [],
      cities: s?.cities ?? [],
      postCodes: s?.postCodes ?? [],
      documentTypes: s?.documentTypes,
      enabledModules: s?.enabledModules,
      contractTemplate: s?.contractTemplate,
      exportConfig: { columns: args.columns },
    };
    await ctx.db.patch(args.organizationId, {
      settings: newSettings as unknown as OrgSettings,
    });

    return { success: true };
  },
});

/**
 * Save uploaded employer (organization signatory) signature to contract template. Admin only.
 */
export const saveEmployerSignature = mutation({
  args: {
    organizationId: v.id("organizations"),
    storageId: v.id("_storage"),
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
      throw new Error("Only organization admins can update employer signature");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const current = org.settings?.contractTemplate ?? {};
    const existingStorageId = (current as { employerSignatureStorageId?: Id<"_storage"> }).employerSignatureStorageId;
    if (existingStorageId) {
      try {
        await ctx.storage.delete(existingStorageId);
      } catch {
        // Storage file already deleted – ignore
      }
    }

    const signatureUrl = await ctx.storage.getUrl(args.storageId);
    const newTemplate = {
      ...current,
      employerSignatureStorageId: args.storageId,
      employerSignatureUrl: signatureUrl ?? undefined,
    };
    const s = org.settings;
    const newSettings = {
      departments: s?.departments ?? [],
      deptGroups: s?.deptGroups ?? [],
      shifts: s?.shifts ?? [],
      shiftAllocations: s?.shiftAllocations ?? [],
      suburbs: s?.suburbs ?? [],
      cities: s?.cities ?? [],
      postCodes: s?.postCodes ?? [],
      documentTypes: s?.documentTypes,
      enabledModules: s?.enabledModules,
      contractTemplate: newTemplate,
      exportConfig: s?.exportConfig,
    };
    type OrgSettings = NonNullable<Doc<"organizations">["settings"]>;
    await ctx.db.patch(args.organizationId, {
      settings: newSettings as unknown as OrgSettings,
    });
    return { success: true };
  },
});

/**
 * Remove employer signature from contract template and delete from storage. Admin only.
 */
export const deleteEmployerSignature = mutation({
  args: { organizationId: v.id("organizations") },
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
      throw new Error("Only organization admins can delete employer signature");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const current = org.settings?.contractTemplate ?? {};
    const storageId = (current as { employerSignatureStorageId?: Id<"_storage"> }).employerSignatureStorageId;
    if (storageId) {
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // Storage file already deleted – ignore
      }
    }

    const newTemplate = {
      companyName: (current as { companyName?: string }).companyName,
      contractHeading: (current as { contractHeading?: string }).contractHeading,
      contractCategory: (current as { contractCategory?: string }).contractCategory,
      defaultTermsAndConditions: (current as { defaultTermsAndConditions?: string }).defaultTermsAndConditions,
      // employerSignatureStorageId and employerSignatureUrl intentionally omitted (deleted)
    };
    const s = org.settings;
    type OrgSettingsDel = NonNullable<Doc<"organizations">["settings"]>;
    const newSettings = {
      departments: s?.departments ?? [],
      deptGroups: s?.deptGroups ?? [],
      shifts: s?.shifts ?? [],
      shiftAllocations: s?.shiftAllocations ?? [],
      suburbs: s?.suburbs ?? [],
      cities: s?.cities ?? [],
      postCodes: s?.postCodes ?? [],
      documentTypes: s?.documentTypes,
      enabledModules: s?.enabledModules,
      contractTemplate: newTemplate,
      exportConfig: s?.exportConfig,
    };
    await ctx.db.patch(args.organizationId, {
      settings: newSettings as unknown as OrgSettingsDel,
    });
    return { success: true };
  },
});

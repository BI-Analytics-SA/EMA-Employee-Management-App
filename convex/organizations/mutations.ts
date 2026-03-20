import { mutation } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireRoleInOrganization } from "../lib/permissions";

/**
 * Create a new organization
 * Also creates a userProfile for the creating user as admin
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if slug is already taken
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existingOrg) {
      throw new Error("An organization with this URL already exists. Please choose a different one.");
    }

    // Resolve display name: from args, or auth user, or fallback
    const user = await ctx.db.get(userId);
    const profileName =
      args.userName?.trim() || user?.name || user?.email || "Admin";

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
      name: profileName,
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

    // Preserve existing module/template/export settings when updating base settings
    const org = await ctx.db.get(args.organizationId);
    const s = org?.settings;

    await ctx.db.patch(args.organizationId, {
      settings: {
        ...args.settings,
        documentTypes: s?.documentTypes,
        jobDocumentTypes: s?.jobDocumentTypes,
        enabledModules: s?.enabledModules,
        contractTemplate: s?.contractTemplate,
        contractTemplates: s?.contractTemplates,
        exportConfig: s?.exportConfig,
      },
    });

    return { success: true };
  },
});

const dataManagementFieldValidator = v.union(
  v.literal("departments"),
  v.literal("deptGroups"),
  v.literal("shifts"),
  v.literal("shiftAllocations")
);

/** Build full settings with one of the data-management arrays updated. */
function mergeSettingsWithDataArray(
  existing: OrgSettings | undefined,
  field: "departments" | "deptGroups" | "shifts" | "shiftAllocations",
  newArray: string[]
): OrgSettings {
  return {
    departments: field === "departments" ? newArray : (existing?.departments ?? []),
    deptGroups: field === "deptGroups" ? newArray : (existing?.deptGroups ?? []),
    shifts: field === "shifts" ? newArray : (existing?.shifts ?? []),
    shiftAllocations: field === "shiftAllocations" ? newArray : (existing?.shiftAllocations ?? []),
    suburbs: existing?.suburbs ?? [],
    cities: existing?.cities ?? [],
    postCodes: existing?.postCodes ?? [],
    documentTypes: existing?.documentTypes,
    jobDocumentTypes: existing?.jobDocumentTypes,
    enabledModules: existing?.enabledModules,
    contractTemplate: existing?.contractTemplate,
    contractTemplates: existing?.contractTemplates,
    exportConfig: existing?.exportConfig,
  };
}

/**
 * Add an item to a data-management array (departments, deptGroups, shifts, shiftAllocations). Admin only.
 */
export const addSettingsItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    field: dataManagementFieldValidator,
    value: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRoleInOrganization(ctx, args.organizationId, "admin");
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }
    const current = org.settings?.[args.field] ?? [];
    const trimmed = args.value.trim();
    if (!trimmed) {
      throw new Error("Value cannot be empty");
    }
    if (current.includes(trimmed)) {
      throw new Error("This value already exists");
    }
    const newArray = [...current, trimmed];
    await ctx.db.patch(args.organizationId, {
      settings: mergeSettingsWithDataArray(org.settings, args.field, newArray),
    });
    return { success: true };
  },
});

/**
 * Remove an item from a data-management array. Admin only.
 */
export const removeSettingsItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    field: dataManagementFieldValidator,
    value: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRoleInOrganization(ctx, args.organizationId, "admin");
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }
    const trimmedValue = args.value.trim();
    if (!trimmedValue) {
      throw new Error("Value cannot be empty");
    }
    const current = org.settings?.[args.field] ?? [];
    const newArray = current.filter((item) => item !== trimmedValue);
    if (newArray.length === current.length) {
      throw new Error("Item not found");
    }
    await ctx.db.patch(args.organizationId, {
      settings: mergeSettingsWithDataArray(org.settings, args.field, newArray),
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

type OrgSettings = Doc<"organizations">["settings"];
type ContractTemplatesArray = NonNullable<NonNullable<OrgSettings>["contractTemplates"]>;

/** Build full settings object so required arrays are never undefined when patching. */
function mergeSettings(
  existing: OrgSettings | undefined,
  override: { documentTypes?: { id: string; name: string; requiresExpiry: boolean; color?: string }[]; jobDocumentTypes?: { id: string; name: string; requiresExpiry: boolean; color?: string }[] }
) {
  return {
    departments: existing?.departments ?? [],
    deptGroups: existing?.deptGroups ?? [],
    shifts: existing?.shifts ?? [],
    shiftAllocations: existing?.shiftAllocations ?? [],
    suburbs: existing?.suburbs ?? [],
    cities: existing?.cities ?? [],
    postCodes: existing?.postCodes ?? [],
    documentTypes: override.documentTypes ?? existing?.documentTypes,
    jobDocumentTypes: override.jobDocumentTypes ?? existing?.jobDocumentTypes,
    enabledModules: existing?.enabledModules,
    contractTemplate: existing?.contractTemplate,
    contractTemplates: existing?.contractTemplates,
    exportConfig: existing?.exportConfig,
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

/**
 * Add a job document type to organization settings (admin only).
 */
export const addJobDocumentType = mutation({
  args: {
    organizationId: v.id("organizations"),
    documentType: documentTypeValidator,
  },
  handler: async (ctx, args) => {
    await requireRoleInOrganization(ctx, args.organizationId, "admin");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    const currentTypes = org.settings?.jobDocumentTypes ?? [];
    if (currentTypes.some((t) => t.id === args.documentType.id)) {
      throw new Error("A job document type with this ID already exists");
    }

    const newTypes = [...currentTypes, args.documentType];
    await ctx.db.patch(args.organizationId, {
      settings: mergeSettings(org.settings, { jobDocumentTypes: newTypes }),
    });
    return { success: true };
  },
});

/**
 * Update an existing job document type (admin only).
 */
export const updateJobDocumentType = mutation({
  args: {
    organizationId: v.id("organizations"),
    id: v.string(),
    name: v.optional(v.string()),
    requiresExpiry: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoleInOrganization(ctx, args.organizationId, "admin");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    const currentTypes = org.settings?.jobDocumentTypes ?? [];
    const index = currentTypes.findIndex((t) => t.id === args.id);
    if (index === -1) throw new Error("Job document type not found");

    const updated = { ...currentTypes[index] };
    if (args.name !== undefined) updated.name = args.name;
    if (args.requiresExpiry !== undefined) updated.requiresExpiry = args.requiresExpiry;
    if (args.color !== undefined) updated.color = args.color;

    const newTypes = [...currentTypes];
    newTypes[index] = updated;

    await ctx.db.patch(args.organizationId, {
      settings: mergeSettings(org.settings, { jobDocumentTypes: newTypes }),
    });
    return { success: true };
  },
});

/**
 * Remove a job document type from organization settings (admin only).
 * Does not delete existing job documents of that type.
 */
export const removeJobDocumentType = mutation({
  args: {
    organizationId: v.id("organizations"),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRoleInOrganization(ctx, args.organizationId, "admin");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    const currentTypes = org.settings?.jobDocumentTypes ?? [];
    const newTypes = currentTypes.filter((t) => t.id !== args.id);
    if (newTypes.length === currentTypes.length) {
      throw new Error("Job document type not found");
    }

    await ctx.db.patch(args.organizationId, {
      settings: mergeSettings(org.settings, { jobDocumentTypes: newTypes }),
    });
    return { success: true };
  },
});

/** Build full settings object with required arrays and updated enabledModules. */
function mergeSettingsWithModules(
  existing: OrgSettings | undefined,
  enabledModules: { contracts?: boolean; documents?: boolean; exporting?: boolean }
) {
  return {
    departments: existing?.departments ?? [],
    deptGroups: existing?.deptGroups ?? [],
    shifts: existing?.shifts ?? [],
    shiftAllocations: existing?.shiftAllocations ?? [],
    suburbs: existing?.suburbs ?? [],
    cities: existing?.cities ?? [],
    postCodes: existing?.postCodes ?? [],
    documentTypes: existing?.documentTypes,
    jobDocumentTypes: existing?.jobDocumentTypes,
    enabledModules,
    contractTemplate: existing?.contractTemplate,
    contractTemplates: existing?.contractTemplates,
    exportConfig: existing?.exportConfig,
  };
}

/**
 * Toggle an add-on module for the organization (admin only).
 */
export const toggleModule = mutation({
  args: {
    organizationId: v.id("organizations"),
    moduleName: v.union(v.literal("contracts"), v.literal("documents"), v.literal("exporting"), v.literal("jobs")),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRoleInOrganization(ctx, args.organizationId, "admin");
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }
    const allowedKeys = ["contracts", "documents", "exporting", "jobs"] as const;
    const current = org.settings?.enabledModules ?? {};
    const newEnabledModules: NonNullable<NonNullable<OrgSettings>["enabledModules"]> = {};
    for (const key of allowedKeys) {
      newEnabledModules[key] = key === args.moduleName ? args.enabled : current[key];
    }
    const newSettings = mergeSettingsWithModules(org.settings, newEnabledModules);
    await ctx.db.patch(args.organizationId, {
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
      jobDocumentTypes: s?.jobDocumentTypes,
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
      jobDocumentTypes: s?.jobDocumentTypes,
      enabledModules: s?.enabledModules,
      contractTemplate: s?.contractTemplate,
      contractTemplates: s?.contractTemplates,
      exportConfig: { columns: args.columns },
    };
    await ctx.db.patch(args.organizationId, {
      settings: newSettings as unknown as OrgSettings,
    });

    return { success: true };
  },
});

/**
 * One-time migration: move settings.contractTemplate to settings.contractTemplates (single Default template)
 * and backfill contract snapshot (companyName, employerSignatureUrl) on existing contracts from org default.
 * Safe to run multiple times (idempotent for orgs already migrated).
 */
export const migrateContractTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") {
      throw new Error("Only organization admins can run migration");
    }
    const org = await ctx.db.get(profile.organizationId);
    if (!org) throw new Error("Organization not found");
    const s = org.settings;
    const existingTemplates = s?.contractTemplates ?? [];
    const legacy = s?.contractTemplate;
    if (existingTemplates.length > 0 && !legacy) {
      return { migrated: false, message: "Already using contractTemplates" };
    }
    let templates: ContractTemplatesArray = [];
    if (existingTemplates.length > 0) {
      templates = existingTemplates;
    } else if (legacy) {
      const t = legacy as {
        companyName?: string;
        contractHeading?: string;
        contractCategory?: string;
        defaultTermsAndConditions?: string;
        employerSignatureStorageId?: Id<"_storage">;
        employerSignatureUrl?: string;
      };
      templates = [
        {
          id: "default",
          name: "Default",
          isDefault: true,
          companyName: t.companyName,
          contractHeading: t.contractHeading,
          contractCategory: t.contractCategory,
          defaultTermsAndConditions: t.defaultTermsAndConditions,
          employerSignatureStorageId: t.employerSignatureStorageId,
          employerSignatureUrl: t.employerSignatureUrl,
        },
      ];
    } else {
      templates = [{ id: "default", name: "Default", isDefault: true }];
    }
    type OrgSettings = NonNullable<Doc<"organizations">["settings"]>;
    const newSettings: OrgSettings = {
      departments: s?.departments ?? [],
      deptGroups: s?.deptGroups ?? [],
      shifts: s?.shifts ?? [],
      shiftAllocations: s?.shiftAllocations ?? [],
      suburbs: s?.suburbs ?? [],
      cities: s?.cities ?? [],
      postCodes: s?.postCodes ?? [],
      documentTypes: s?.documentTypes,
      jobDocumentTypes: s?.jobDocumentTypes,
      enabledModules: s?.enabledModules,
      contractTemplates: templates,
      exportConfig: s?.exportConfig,
    };
    await ctx.db.patch(profile.organizationId, { settings: newSettings });

    const defaultTemplate = templates.find((x) => x.isDefault) ?? templates[0];
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_organization", (q) => q.eq("organizationId", profile.organizationId))
      .collect();
    let backfilled = 0;
    for (const c of contracts) {
      if (c.companyName !== undefined && c.employerSignatureUrl !== undefined) continue;
      const patch: { companyName?: string; employerSignatureUrl?: string; employerSignatureStorageId?: Id<"_storage">; templateId?: string } = {};
      if (c.companyName === undefined && defaultTemplate?.companyName !== undefined)
        patch.companyName = defaultTemplate.companyName;
      if (c.employerSignatureUrl === undefined && defaultTemplate?.employerSignatureUrl !== undefined)
        patch.employerSignatureUrl = defaultTemplate.employerSignatureUrl;
      if (c.employerSignatureStorageId === undefined && defaultTemplate?.employerSignatureStorageId !== undefined)
        patch.employerSignatureStorageId = defaultTemplate.employerSignatureStorageId;
      if (c.templateId === undefined) patch.templateId = defaultTemplate?.id ?? "default";
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(c._id, patch);
        backfilled += 1;
      }
    }
    return { migrated: true, backfilled };
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
      jobDocumentTypes: s?.jobDocumentTypes,
      enabledModules: s?.enabledModules,
      contractTemplate: newTemplate,
      contractTemplates: s?.contractTemplates,
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
      jobDocumentTypes: s?.jobDocumentTypes,
      enabledModules: s?.enabledModules,
      contractTemplate: newTemplate,
      contractTemplates: s?.contractTemplates,
      exportConfig: s?.exportConfig,
    };
    await ctx.db.patch(args.organizationId, {
      settings: newSettings as unknown as OrgSettingsDel,
    });
    return { success: true };
  },
});

// --- Multiple contract templates (EMA-5) ---

function buildFullSettings(
  s: OrgSettings | undefined,
  override: { contractTemplates: NonNullable<OrgSettings>["contractTemplates"] }
): OrgSettings {
  return {
    departments: s?.departments ?? [],
    deptGroups: s?.deptGroups ?? [],
    shifts: s?.shifts ?? [],
    shiftAllocations: s?.shiftAllocations ?? [],
    suburbs: s?.suburbs ?? [],
    cities: s?.cities ?? [],
    postCodes: s?.postCodes ?? [],
    documentTypes: s?.documentTypes,
    jobDocumentTypes: s?.jobDocumentTypes,
    enabledModules: s?.enabledModules,
    contractTemplate: s?.contractTemplate,
    contractTemplates: override.contractTemplates,
    exportConfig: s?.exportConfig,
  };
}

export const addContractTemplate = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    setAsDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Only organization admins can manage templates");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    const templates = org.settings?.contractTemplates ?? [];
    const id = crypto.randomUUID();
    let next = [
      ...templates.map((t) => ({ ...t, isDefault: args.setAsDefault ? t.id === id : t.isDefault })),
      {
        id,
        name: args.name.trim() || "New template",
        isDefault: args.setAsDefault ?? (templates.length === 0),
        companyName: undefined,
        contractHeading: undefined,
        contractCategory: undefined,
        defaultTermsAndConditions: undefined,
        employerSignatureStorageId: undefined,
        employerSignatureUrl: undefined,
      },
    ];
    if (args.setAsDefault) {
      next = next.map((t) => ({ ...t, isDefault: t.id === id }));
    } else if (templates.length === 0) {
      next = next.map((t) => ({ ...t, isDefault: t.id === id }));
    }
    await ctx.db.patch(args.organizationId, {
      settings: buildFullSettings(org.settings, { contractTemplates: next }),
    });
    return id;
  },
});

export const updateContractTemplateById = mutation({
  args: {
    organizationId: v.id("organizations"),
    templateId: v.string(),
    name: v.optional(v.string()),
    companyName: v.optional(v.string()),
    contractHeading: v.optional(v.string()),
    contractCategory: v.optional(v.string()),
    defaultTermsAndConditions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Only organization admins can manage templates");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    const templates = [...(org.settings?.contractTemplates ?? [])];
    const i = templates.findIndex((t) => t.id === args.templateId);
    if (i === -1) throw new Error("Template not found");
    const t = templates[i];
    if (args.name !== undefined) t.name = args.name.trim() || t.name;
    if (args.companyName !== undefined) t.companyName = args.companyName;
    if (args.contractHeading !== undefined) t.contractHeading = args.contractHeading;
    if (args.contractCategory !== undefined) t.contractCategory = args.contractCategory;
    if (args.defaultTermsAndConditions !== undefined) t.defaultTermsAndConditions = args.defaultTermsAndConditions;
    templates[i] = t;
    await ctx.db.patch(args.organizationId, {
      settings: buildFullSettings(org.settings, { contractTemplates: templates }),
    });
    return { success: true };
  },
});

export const removeContractTemplate = mutation({
  args: { organizationId: v.id("organizations"), templateId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Only organization admins can manage templates");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    const templates = org.settings?.contractTemplates ?? [];
    const t = templates.find((x) => x.id === args.templateId);
    if (!t) throw new Error("Template not found");
    if (t.isDefault) throw new Error("Cannot delete the default template");
    const next = templates.filter((x) => x.id !== args.templateId);
    await ctx.db.patch(args.organizationId, {
      settings: buildFullSettings(org.settings, { contractTemplates: next }),
    });
    return { success: true };
  },
});

export const setDefaultContractTemplate = mutation({
  args: { organizationId: v.id("organizations"), templateId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Only organization admins can manage templates");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    const templates = (org.settings?.contractTemplates ?? []).map((t) => ({
      ...t,
      isDefault: t.id === args.templateId,
    }));
    const found = templates.some((t) => t.id === args.templateId);
    if (!found) throw new Error("Template not found");
    await ctx.db.patch(args.organizationId, {
      settings: buildFullSettings(org.settings, { contractTemplates: templates }),
    });
    return { success: true };
  },
});

export const saveEmployerSignatureForTemplate = mutation({
  args: {
    organizationId: v.id("organizations"),
    templateId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Only organization admins can update employer signature");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    const templates = [...(org.settings?.contractTemplates ?? [])];
    const i = templates.findIndex((t) => t.id === args.templateId);
    if (i === -1) throw new Error("Template not found");
    const existingId = templates[i].employerSignatureStorageId;
    if (existingId) {
      try {
        await ctx.storage.delete(existingId);
      } catch {
        // ignore
      }
    }
    const url = await ctx.storage.getUrl(args.storageId);
    templates[i] = {
      ...templates[i],
      employerSignatureStorageId: args.storageId,
      employerSignatureUrl: url ?? undefined,
    };
    await ctx.db.patch(args.organizationId, {
      settings: buildFullSettings(org.settings, { contractTemplates: templates }),
    });
    return { success: true };
  },
});

export const deleteEmployerSignatureForTemplate = mutation({
  args: { organizationId: v.id("organizations"), templateId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Only organization admins can delete employer signature");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    const templates = [...(org.settings?.contractTemplates ?? [])];
    const i = templates.findIndex((t) => t.id === args.templateId);
    if (i === -1) throw new Error("Template not found");
    const storageId = templates[i].employerSignatureStorageId;
    if (storageId) {
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // ignore
      }
    }
    templates[i] = {
      ...templates[i],
      employerSignatureStorageId: undefined,
      employerSignatureUrl: undefined,
    };
    await ctx.db.patch(args.organizationId, {
      settings: buildFullSettings(org.settings, { contractTemplates: templates }),
    });
    return { success: true };
  },
});

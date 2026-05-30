import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import {
  getAuthUserEmail,
  normalizePlatformEmail,
  requirePlatformAdmin,
} from "../lib/platformAdmin";
import { syncPlanEventsFromOrg } from "../lib/planEvents";

const BOOTSTRAP_EMAIL = "brandon@bi-analytics.co.za";

type OrgSettings = Doc<"organizations">["settings"];

const moduleFlagsValidator = v.object({
  contracts: v.boolean(),
  documents: v.boolean(),
  exporting: v.boolean(),
  jobs: v.boolean(),
});

const optionalTimestamp = v.optional(v.union(v.number(), v.null()));

function mergeSettingsWithAllowedModules(
  existing: OrgSettings | undefined,
  allowedModules: {
    contracts: boolean;
    documents: boolean;
    exporting: boolean;
    jobs: boolean;
  }
): OrgSettings {
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
    enabledModules: existing?.enabledModules,
    allowedModules,
    contractTemplate: existing?.contractTemplate,
    contractTemplates: existing?.contractTemplates,
    exportConfig: existing?.exportConfig,
  };
}

function applyOptionalTimestamp(
  patch: Record<string, unknown>,
  key: string,
  value: number | null | undefined
) {
  if (value === undefined) return;
  if (value === null) {
    patch[key] = undefined;
  } else {
    patch[key] = value;
  }
}

/** First-time setup when platformAdmins table is empty (brandon@bi-analytics.co.za only). */
export const bootstrapIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const email = await getAuthUserEmail(ctx);
    const existing = await ctx.db.query("platformAdmins").first();
    if (existing) {
      throw new ConvexError("Platform administrators are already configured");
    }
    if (email !== normalizePlatformEmail(BOOTSTRAP_EMAIL)) {
      throw new ConvexError("Only the primary account can initialize platform access");
    }
    await ctx.db.insert("platformAdmins", {
      email,
      addedAt: Date.now(),
    });
    return { success: true };
  },
});

export const addPlatformAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const actorEmail = await requirePlatformAdmin(ctx);
    const email = normalizePlatformEmail(args.email);
    if (!email.includes("@")) {
      throw new ConvexError("Please enter a valid email address");
    }
    const existing = await ctx.db
      .query("platformAdmins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      throw new ConvexError("This email is already a platform administrator");
    }
    await ctx.db.insert("platformAdmins", {
      email,
      addedAt: Date.now(),
      addedByEmail: actorEmail,
    });
    return { success: true };
  },
});

export const removePlatformAdmin = mutation({
  args: { id: v.id("platformAdmins") },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) {
      throw new ConvexError("Platform administrator not found");
    }
    const all = await ctx.db.query("platformAdmins").collect();
    if (all.length <= 1) {
      throw new ConvexError("Cannot remove the last platform administrator");
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const updateOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
    planStatus: v.union(
      v.literal("trial"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("legacy_active")
    ),
    trialEndsAt: optionalTimestamp,
    signedUpAt: optionalTimestamp,
    trialStartedAt: optionalTimestamp,
    planActivatedAt: optionalTimestamp,
    planExpiredAt: optionalTimestamp,
    allowedModules: moduleFlagsValidator,
    setAllowedModules: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError("Organization not found");
    }

    const patch: Record<string, unknown> = {};

    if (args.planStatus === "legacy_active") {
      patch.planStatus = undefined;
      patch.trialEndsAt = undefined;
    } else if (args.planStatus === "trial") {
      patch.planStatus = args.planStatus;
    } else {
      patch.planStatus = args.planStatus;
    }

    if (args.planStatus === "active" || args.planStatus === "legacy_active") {
      if (args.planActivatedAt === undefined && !org.planActivatedAt) {
        patch.planActivatedAt = Date.now();
      }
    }

    applyOptionalTimestamp(patch, "trialEndsAt", args.trialEndsAt);
    applyOptionalTimestamp(patch, "signedUpAt", args.signedUpAt);
    applyOptionalTimestamp(patch, "trialStartedAt", args.trialStartedAt);
    applyOptionalTimestamp(patch, "planActivatedAt", args.planActivatedAt);
    applyOptionalTimestamp(patch, "planExpiredAt", args.planExpiredAt);

    if (args.setAllowedModules) {
      patch.settings = mergeSettingsWithAllowedModules(
        org.settings,
        args.allowedModules
      );
    }

    await ctx.db.patch(args.organizationId, patch);

    const updated = await ctx.db.get(args.organizationId);
    if (updated) {
      await syncPlanEventsFromOrg(ctx, updated);
    }

    return { success: true };
  },
});

export const extendTrial = mutation({
  args: {
    organizationId: v.id("organizations"),
    additionalDays: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    if (args.additionalDays < 1 || args.additionalDays > 365) {
      throw new ConvexError("Additional days must be between 1 and 365");
    }
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new ConvexError("Organization not found");
    }
    const now = Date.now();
    const base =
      org.trialEndsAt && org.trialEndsAt > now ? org.trialEndsAt : now;
    const trialEndsAt = base + args.additionalDays * 24 * 60 * 60 * 1000;
    const trialStartedAt = org.trialStartedAt ?? org.signedUpAt ?? org.createdAt;
    await ctx.db.patch(args.organizationId, {
      planStatus: "trial",
      trialEndsAt,
      trialStartedAt,
      planActivatedAt: undefined,
      planExpiredAt: undefined,
    });
    const updated = await ctx.db.get(args.organizationId);
    if (updated) {
      await syncPlanEventsFromOrg(ctx, updated);
    }
    return { success: true, trialEndsAt };
  },
});

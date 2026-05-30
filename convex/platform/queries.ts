import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  resolveInvoicedModules,
  resolveTrialUsageModules,
  monthlyInvoiceZar,
  countModules,
  moduleFlagsFromSettings,
  emptyModuleFlags,
  MODULE_KEYS as BILLING_MODULE_KEYS,
} from "../lib/billing";
import { buildSastBuckets, toSastDateString } from "../lib/calendarDates";
import { isOrgPlanLocked } from "../lib/planAccess";
import {
  effectiveSignedUpAt,
  isActiveTrialOrg,
  isExpiredTrialOrg,
  isPaidForInvoicing,
  orgStateFromEvents,
  type PlanEventType,
} from "../lib/planEvents";
import {
  getAuthUserEmail,
  isPlatformAdminEmail,
  normalizePlatformEmail,
  requirePlatformAdmin,
} from "../lib/platformAdmin";
import type { Doc } from "../_generated/dataModel";

const MODULE_KEYS = ["contracts", "documents", "exporting", "jobs"] as const;

function formatPlanStatus(org: Doc<"organizations">) {
  const status = org.planStatus;
  if (status === undefined) return "legacy_active" as const;
  return status;
}

const BOOTSTRAP_EMAIL = "brandon@bi-analytics.co.za";

export const canBootstrapPlatform = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    if (!user?.email) return false;
    if (normalizePlatformEmail(user.email) !== BOOTSTRAP_EMAIL) return false;
    const existing = await ctx.db.query("platformAdmins").first();
    return existing === null;
  },
});

export const isCurrentUserPlatformAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    try {
      const email = await getAuthUserEmail(ctx);
      return await isPlatformAdminEmail(ctx, email);
    } catch {
      return false;
    }
  },
});

export const listPlatformAdmins = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const rows = await ctx.db.query("platformAdmins").collect();
    return rows
      .map((r) => ({
        id: r._id,
        email: r.email,
        addedAt: r.addedAt,
        addedByEmail: r.addedByEmail,
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  },
});

export const listOrganizations = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const orgs = await ctx.db.query("organizations").collect();
    const now = Date.now();

    const results = await Promise.all(
      orgs.map(async (org) => {
        const members = await ctx.db
          .query("userProfiles")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();
        const trialEndsAt = org.trialEndsAt;
        let trialDaysRemaining: number | null = null;
        if (org.planStatus === "trial" && trialEndsAt && trialEndsAt > now) {
          trialDaysRemaining = Math.ceil((trialEndsAt - now) / (24 * 60 * 60 * 1000));
        }

        return {
          id: org._id,
          name: org.name,
          slug: org.slug,
          createdAt: org.createdAt,
          signedUpAt: org.signedUpAt ?? org.createdAt,
          trialStartedAt: org.trialStartedAt ?? null,
          planActivatedAt: org.planActivatedAt ?? null,
          planExpiredAt: org.planExpiredAt ?? null,
          planStatus: formatPlanStatus(org),
          trialEndsAt: org.trialEndsAt ?? null,
          trialDaysRemaining,
          memberCount: members.length,
          allowedModules: {
            contracts: org.settings?.allowedModules?.contracts === true,
            documents: org.settings?.allowedModules?.documents === true,
            exporting: org.settings?.allowedModules?.exporting === true,
            jobs: org.settings?.allowedModules?.jobs === true,
          },
          enabledModules: {
            contracts: org.settings?.enabledModules?.contracts === true,
            documents: org.settings?.enabledModules?.documents === true,
            exporting: org.settings?.enabledModules?.exporting === true,
            jobs: org.settings?.enabledModules?.jobs === true,
          },
          hasAllowedModulesConfigured: org.settings?.allowedModules !== undefined,
        };
      })
    );

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },
});

const calendarDateStr = v.string();

export const getBillingAnalytics = query({
  args: {
    /** Inclusive range, YYYY-MM-DD (SAST calendar — matches date pickers). */
    startDate: calendarDateStr,
    endDate: calendarDateStr,
    granularity: v.union(v.literal("day"), v.literal("month")),
  },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const now = Date.now();
    const orgs = await ctx.db.query("organizations").collect();
    const buckets = buildSastBuckets(args.startDate, args.endDate, args.granularity);

    const allEvents = await ctx.db.query("organizationPlanEvents").collect();
    const eventsByOrg = new Map<
      string,
      { eventType: PlanEventType; occurredAt: number }[]
    >();
    for (const e of allEvents) {
      const key = e.organizationId;
      const list = eventsByOrg.get(key) ?? [];
      list.push({ eventType: e.eventType, occurredAt: e.occurredAt });
      eventsByOrg.set(key, list);
    }

    const orgIdsWithEvents = new Set(eventsByOrg.keys());

    const trend = buckets.map((bucket) => {
      const signupsForBucket = orgs.filter((o) => {
        const at = effectiveSignedUpAt(o);
        if (args.granularity === "day") {
          return toSastDateString(at) === toSastDateString(bucket.startMs);
        }
        return at >= bucket.startMs && at <= bucket.endMs;
      });
      const signups = signupsForBucket.length;

      const paidActivations = orgs.filter((o) => {
        if (o.planActivatedAt === undefined) return false;
        if (args.granularity === "day") {
          return toSastDateString(o.planActivatedAt) === toSastDateString(bucket.startMs);
        }
        return (
          o.planActivatedAt >= bucket.startMs && o.planActivatedAt <= bucket.endMs
        );
      }).length;

      let trialOrgsAtPeriodEnd = 0;
      let paidOrgsAtPeriodEnd = 0;
      for (const org of orgs) {
        const events = eventsByOrg.get(org._id);
        if (!events?.length) continue;
        const state = orgStateFromEvents(events, bucket.endMs);
        if (state === "trial") trialOrgsAtPeriodEnd += 1;
        if (state === "paid") paidOrgsAtPeriodEnd += 1;
      }

      return {
        label: bucket.label,
        startMs: bucket.startMs,
        signups,
        paidActivations,
        trialOrgsAtPeriodEnd,
        paidOrgsAtPeriodEnd,
      };
    });

    const orgRows = await Promise.all(
      orgs.map(async (org) => {
        const members = await ctx.db
          .query("userProfiles")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();
        const employees = await ctx.db
          .query("employees")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();

        const invoiced = resolveInvoicedModules(org, now);
        const trialUsage = resolveTrialUsageModules(org, now);
        const isPaid = isPaidForInvoicing(org, now) && !isOrgPlanLocked(org, now);
        const isTrial = isActiveTrialOrg(org, now);

        const lastActiveAt = members.reduce<number | null>((max, m) => {
          if (m.lastLoginAt === undefined) return max;
          return max === null ? m.lastLoginAt : Math.max(max, m.lastLoginAt);
        }, null);

        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const activeMembers30d = members.filter(
          (m) => m.lastLoginAt !== undefined && m.lastLoginAt >= thirtyDaysAgo
        ).length;

        const planStatus = formatPlanStatus(org);
        const payingSince = org.planActivatedAt ?? null;
        let daysAsPayingCustomer: number | null = null;
        if (payingSince && isPaid) {
          daysAsPayingCustomer = Math.floor((now - payingSince) / (24 * 60 * 60 * 1000));
        }

        const moduleSource = isPaid
          ? invoiced.source
          : isTrial
            ? ("enabled" as const)
            : ("none" as const);
        const modules = isPaid ? invoiced.modules : isTrial ? trialUsage.modules : emptyModuleFlags();
        const moduleCount = isPaid
          ? invoiced.moduleCount
          : isTrial
            ? trialUsage.moduleCount
            : 0;

        return {
          id: org._id,
          name: org.name,
          slug: org.slug,
          planStatus,
          signedUpAt: effectiveSignedUpAt(org),
          payingSince,
          daysAsPayingCustomer,
          isInvoiced: isPaid,
          isTrialUsage: isTrial,
          moduleSource,
          modules,
          moduleCount,
          monthlyInvoiceZar: isPaid ? monthlyInvoiceZar(invoiced.moduleCount) : 0,
          memberCount: members.length,
          activeMembers30d,
          employeeCount: employees.length,
          lastActiveAt,
          hasPlanHistory: orgIdsWithEvents.has(org._id),
        };
      })
    );

    orgRows.sort((a, b) => a.name.localeCompare(b.name));

    const invoicingRows = orgRows.filter((r) => r.isInvoiced);
    const trialUsageRows = orgRows.filter((r) => r.isTrialUsage);

    const snapshot = {
      totalOrgs: orgs.length,
      activeTrial: orgs.filter((o) => isActiveTrialOrg(o, now)).length,
      activePaid: orgs.filter((o) => isPaidForInvoicing(o, now) && !isOrgPlanLocked(o, now))
        .length,
      expired: orgs.filter(
        (o) => o.planStatus === "expired" || (o.planStatus === "trial" && isOrgPlanLocked(o, now))
      ).length,
      totalMonthlyRevenueZar: invoicingRows.reduce((sum, r) => sum + r.monthlyInvoiceZar, 0),
      totalInvoicedModules: invoicingRows.reduce((sum, r) => sum + r.moduleCount, 0),
      totalTrialModulesInUse: trialUsageRows.reduce((sum, r) => sum + r.moduleCount, 0),
      orgsWithPlanHistory: orgIdsWithEvents.size,
    };

    const orgById = new Map(orgs.map((o) => [o._id, o]));
    const expiredTrialOrgs = orgRows
      .filter((r) => {
        const org = orgById.get(r.id);
        return org !== undefined && isExpiredTrialOrg(org, now);
      })
      .map((r) => {
        const org = orgById.get(r.id)!;
        const enabled = moduleFlagsFromSettings(org.settings?.enabledModules);
        return {
          ...r,
          modules: enabled,
          moduleCount: countModules(enabled),
          moduleSource: "enabled" as const,
          trialEndedAt: org.trialEndsAt ?? null,
          trialEndedAtSast:
            org.trialEndsAt !== undefined ? toSastDateString(org.trialEndsAt) : null,
          signedUpAtSast: toSastDateString(r.signedUpAt),
        };
      });

    return {
      trend,
      expiredTrialOrgs,
      orgRows,
      invoicingRows,
      trialUsageRows,
      snapshot,
      moduleKeys: [...BILLING_MODULE_KEYS],
    };
  },
});

export { MODULE_KEYS, normalizePlatformEmail };

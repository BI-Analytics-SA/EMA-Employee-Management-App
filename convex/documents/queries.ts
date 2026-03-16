import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrganizationAccess } from "../lib/permissions";

/**
 * List all documents for an employee (must belong to user's organization).
 */
export const listByEmployee = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      return [];
    }
    await requireOrganizationAccess(ctx, employee.organizationId);

    return await ctx.db
      .query("employeeDocuments")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single document by ID.
 */
export const getById = query({
  args: { id: v.id("employeeDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      return null;
    }
    await requireOrganizationAccess(ctx, doc.organizationId);
    return doc;
  },
});

const DEFAULT_EXPIRY_WINDOW_DAYS = 90;

/**
 * Get all expiring or expired documents for the organization.
 * Optional: limit to next N days (daysAhead) and/or only expired (expiredOnly).
 */
export const getExpiringByOrganization = query({
  args: {
    organizationId: v.id("organizations"),
    daysAhead: v.optional(v.number()),
    expiredOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const daysAhead = args.daysAhead ?? DEFAULT_EXPIRY_WINDOW_DAYS;
    const futureCutoff = now + daysAhead * dayMs;

    const docs = await ctx.db
      .query("employeeDocuments")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    return docs.filter((d) => {
      if (d.expiryDate == null) return false;
      if (args.expiredOnly) return d.expiryDate < now;
      return d.expiryDate <= futureCutoff;
    });
  },
});

/**
 * Get expiring/expired documents with employee info for display.
 */
export const getExpiringWithEmployees = query({
  args: {
    organizationId: v.id("organizations"),
    daysAhead: v.optional(v.number()),
    expiredOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const daysAhead = args.daysAhead ?? DEFAULT_EXPIRY_WINDOW_DAYS;
    const futureCutoff = now + daysAhead * dayMs;

    const docs = await ctx.db
      .query("employeeDocuments")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const filtered = docs.filter((d) => {
      if (d.expiryDate == null) return false;
      if (args.expiredOnly) return d.expiryDate < now;
      return d.expiryDate <= futureCutoff;
    });

    const uniqueEmployeeIds = Array.from(new Set(filtered.map((d) => d.employeeId)));
    const employees = await Promise.all(uniqueEmployeeIds.map((id) => ctx.db.get(id)));
    const employeeMap = new Map(
      uniqueEmployeeIds.map((id, i) => [id, employees[i]] as const)
    );

    return filtered.map((doc) => {
      const employee = employeeMap.get(doc.employeeId) ?? null;
      return {
        document: doc,
        employee: employee
          ? {
              _id: employee._id,
              firstName: employee.firstName,
              lastName: employee.lastName,
              title: employee.title,
            }
          : null,
      };
    });
  },
});

/**
 * Get expiry stats per employee (count of expired and expiring soon) for the org.
 * Used for dashboard summary. daysBeforeExpiry = threshold for "expiring soon".
 */
export const getExpiryStats = query({
  args: {
    organizationId: v.id("organizations"),
    daysBeforeExpiry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const daysBefore = args.daysBeforeExpiry ?? 30;
    const expiringSoonThreshold = now + daysBefore * dayMs;

    const docs = await ctx.db
      .query("employeeDocuments")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const byEmployee: Record<
      string,
      { expired: number; expiringSoon: number }
    > = {};

    for (const doc of docs) {
      if (doc.expiryDate == null) continue;
      const eid = doc.employeeId;
      if (!byEmployee[eid]) {
        byEmployee[eid] = { expired: 0, expiringSoon: 0 };
      }
      if (doc.expiryDate < now) {
        byEmployee[eid].expired += 1;
      } else if (doc.expiryDate <= expiringSoonThreshold) {
        byEmployee[eid].expiringSoon += 1;
      }
    }

    return byEmployee;
  },
});

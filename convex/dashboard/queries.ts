import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrganizationAccess } from "../lib/permissions";

const DEFAULT_EXPIRY_WINDOW_DAYS = 90;

/**
 * Get all dashboard stats in a single query to avoid multiple round-trips.
 * Returns employee count, recent employees, expiring document count,
 * contract count, and pending invite count.
 */
export const getDashboardStats = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    // --- Total employees ---
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_organization_createdAt", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .collect();

    const totalEmployees = employees.length;

    // --- Employees missing Date Engaged ---
    const employeesWithoutDateEngaged = employees.filter(
      (emp) => emp.dateEngaged == null || emp.dateEngaged === 0
    ).length;

    // --- Employees missing Tax Number ---
    const employeesWithoutTaxNumber = employees.filter(
      (emp) => !emp.taxNumber || emp.taxNumber.trim() === ""
    ).length;

    // --- Recent employees (last 5) ---
    const recentEmployees = employees.slice(0, 5).map((emp) => ({
      _id: emp._id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      title: emp.title,
      idNumber: emp.idNumber,
      imageUrl: emp.imageUrl ?? null,
      createdAt: emp.createdAt,
    }));

    // --- Expiring documents count (only if documents module is enabled) ---
    const org = await ctx.db.get(args.organizationId);
    const documentsEnabled =
      org?.settings?.enabledModules?.documents === true;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const futureCutoff = now + DEFAULT_EXPIRY_WINDOW_DAYS * dayMs;

    let expiringDocumentsCount: number | null = null;
    if (documentsEnabled) {
      const docs = await ctx.db
        .query("employeeDocuments")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .collect();

      expiringDocumentsCount = docs.filter((d) => {
        if (d.expiryDate == null) return false;
        return d.expiryDate <= futureCutoff;
      }).length;
    }

    // --- Expiring job documents count (only if jobs module is enabled) ---
    const jobsEnabled = org?.settings?.enabledModules?.jobs === true;

    let expiringJobDocumentsCount: number | null = null;
    if (jobsEnabled) {
      const jobDocs = await ctx.db
        .query("jobDocuments")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .collect();

      expiringJobDocumentsCount = jobDocs.filter((d) => {
        if (d.expiryDate == null) return false;
        return d.expiryDate <= futureCutoff;
      }).length;
    }

    // --- Total contracts (only if contracts module is enabled) ---
    const contractsEnabled =
      org?.settings?.enabledModules?.contracts === true;

    let totalContracts: number | null = null;
    if (contractsEnabled) {
      const contracts = await ctx.db
        .query("contracts")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .collect();

      totalContracts = contracts.length;
    }

    return {
      totalEmployees,
      employeesWithoutDateEngaged,
      employeesWithoutTaxNumber,
      recentEmployees,
      expiringDocumentsCount,
      expiringJobDocumentsCount,
      totalContracts,
    };
  },
});

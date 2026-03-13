/**
 * One-off migration: strip removed fields from all employee documents.
 * Run once from the Convex dashboard (Functions → stripEmployeeFields → Run).
 * Safe to run multiple times (idempotent).
 */
import { mutation } from "../_generated/server";

const FIELDS_TO_STRIP = [
  "departmentWorked",
  "deptGroup",
  "shift",
  "shiftAlloc",
  "training",
] as const;

export const stripEmployeeFields = mutation({
  args: {},
  handler: async (ctx) => {
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_createdAt")
      .collect();

    const patch = Object.fromEntries(
      FIELDS_TO_STRIP.map((field) => [field, undefined])
    ) as Record<string, undefined>;

    let updated = 0;
    for (const emp of employees) {
      const hasAny = FIELDS_TO_STRIP.some((f) => (emp as Record<string, unknown>)[f] !== undefined);
      if (hasAny) {
        await ctx.db.patch(emp._id, patch);
        updated++;
      }
    }

    return { total: employees.length, updated };
  },
});

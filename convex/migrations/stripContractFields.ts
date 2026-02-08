/**
 * One-off migration: strip removed fields from all contract documents.
 * Removes: season, bootsAmount, training, deptGroup, shift, shiftAlloc
 *
 * Run once from the Convex dashboard (Functions → migrations/stripContractFields → Run).
 * Safe to run multiple times (idempotent).
 */
import { mutation } from "../_generated/server";

const FIELDS_TO_STRIP = [
  "season",
  "bootsAmount",
  "training",
  "deptGroup",
  "shift",
  "shiftAlloc",
] as const;

export const stripContractFields = mutation({
  args: {},
  handler: async (ctx) => {
    const organizations = await ctx.db.query("organizations").collect();
    let total = 0;
    let updated = 0;

    const patch = Object.fromEntries(
      FIELDS_TO_STRIP.map((field) => [field, undefined])
    ) as Record<string, undefined>;

    for (const org of organizations) {
      const contracts = await ctx.db
        .query("contracts")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .collect();

      for (const contract of contracts) {
        total++;
        const hasAny = FIELDS_TO_STRIP.some(
          (f) => (contract as Record<string, unknown>)[f] !== undefined
        );
        if (hasAny) {
          await ctx.db.patch(contract._id, patch);
          updated++;
        }
      }
    }

    return { total, updated };
  },
});

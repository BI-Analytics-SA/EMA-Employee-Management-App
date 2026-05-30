/**
 * One-off: seed the first platform administrator.
 * Run once: npx convex run migrations/seedPlatformAdmins:seed
 * Safe to run multiple times (skips if brandon@bi-analytics.co.za already exists).
 */
import { internalMutation } from "../_generated/server";

const SEED_EMAIL = "brandon@bi-analytics.co.za";

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const normalized = SEED_EMAIL.toLowerCase();
    const existing = await ctx.db
      .query("platformAdmins")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
    if (existing) {
      return { seeded: false, message: "Platform admin already exists" };
    }
    await ctx.db.insert("platformAdmins", {
      email: normalized,
      addedAt: Date.now(),
    });
    return { seeded: true, email: normalized };
  },
});

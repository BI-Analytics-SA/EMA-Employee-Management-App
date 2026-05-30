import type { QueryCtx, MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export function normalizePlatformEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getAuthUserEmail(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Not authenticated");
  }
  const user = await ctx.db.get(userId);
  const email = user?.email;
  if (!email) {
    throw new ConvexError("User account has no email");
  }
  return normalizePlatformEmail(email);
}

export async function isPlatformAdminEmail(
  ctx: QueryCtx | MutationCtx,
  email: string
): Promise<boolean> {
  const normalized = normalizePlatformEmail(email);
  const row = await ctx.db
    .query("platformAdmins")
    .withIndex("by_email", (q) => q.eq("email", normalized))
    .first();
  return row !== null;
}

export async function requirePlatformAdmin(ctx: QueryCtx | MutationCtx): Promise<string> {
  const email = await getAuthUserEmail(ctx);
  const allowed = await isPlatformAdminEmail(ctx, email);
  if (!allowed) {
    throw new ConvexError("Platform administrator access required");
  }
  return email;
}

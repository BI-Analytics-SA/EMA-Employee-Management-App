import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export type Role = "admin" | "manager" | "user";

export type ModuleName = "contracts" | "documents" | "exporting" | "jobs";

/**
 * Require that the given module is enabled for the organization.
 * Call before any contract or other module query/mutation.
 */
export async function requireModuleEnabled(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  moduleName: ModuleName
): Promise<void> {
  const org = await ctx.db.get(organizationId);
  if (!org) throw new Error("Organization not found");
  const enabled = org.settings?.enabledModules?.[moduleName];
  if (!enabled) {
    throw new Error(`Module "${moduleName}" is not enabled for this organization`);
  }
}

/**
 * Get the authenticated user's ID from Convex Auth
 */
export async function getAuthenticatedUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/**
 * Get the currently authenticated user's profile from the context
 * Returns the userProfile which contains organization and role info
 */
export async function getAuthenticatedUserProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<"userProfiles">> {
  const userId = await getAuthenticatedUserId(ctx);

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!profile) {
    throw new Error("User profile not found. Please complete your profile setup.");
  }

  if (!profile.isActive) {
    throw new Error("User account is deactivated");
  }

  return profile;
}

/**
 * Get the currently authenticated user's profile or null if not found
 */
export async function getOptionalUserProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<"userProfiles"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  return await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
}

/**
 * Verify that a user has access to a specific organization.
 * Uses by_user_organization index for multi-org support.
 */
export async function requireOrganizationAccess(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">
): Promise<Doc<"userProfiles">> {
  const userId = await getAuthenticatedUserId(ctx);

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user_organization", (q) =>
      q.eq("userId", userId).eq("organizationId", organizationId)
    )
    .first();

  if (!profile) {
    throw new Error("Access denied: You do not belong to this organization");
  }

  if (!profile.isActive) {
    throw new Error("User account is deactivated");
  }

  return profile;
}

/**
 * Check if a user has a minimum required role
 * Role hierarchy: admin > manager > user
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    admin: 3,
    manager: 2,
    user: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Require a minimum role for the current user
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  requiredRole: Role
): Promise<Doc<"userProfiles">> {
  const profile = await getAuthenticatedUserProfile(ctx);

  if (!hasMinimumRole(profile.role, requiredRole)) {
    throw new Error(`Access denied: ${requiredRole} role or higher required`);
  }

  return profile;
}

/**
 * Require a specific role and organization access
 */
export async function requireRoleInOrganization(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  requiredRole: Role
): Promise<Doc<"userProfiles">> {
  const profile = await requireOrganizationAccess(ctx, organizationId);

  if (!hasMinimumRole(profile.role, requiredRole)) {
    throw new Error(`Access denied: ${requiredRole} role or higher required`);
  }

  return profile;
}

/**
 * Check if user can manage other users (admin only)
 */
export function canManageUsers(role: Role): boolean {
  return role === "admin";
}

/**
 * Check if user can create/edit contracts (manager+)
 */
export function canManageContracts(role: Role): boolean {
  return hasMinimumRole(role, "manager");
}

/**
 * Check if user can create/edit employees (user+)
 */
export function canManageEmployees(role: Role): boolean {
  return hasMinimumRole(role, "user");
}

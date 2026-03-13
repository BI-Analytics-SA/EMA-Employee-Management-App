import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useOrganizationContext } from "@/contexts/OrganizationContext";

/**
 * Hook for accessing the current user's profile and organization for the active org.
 * Must be used within OrganizationProvider (inside the main app shell).
 */
export function useCurrentUser() {
  const { activeOrganizationId, isLoading: orgContextLoading } = useOrganizationContext();
  const profile = useQuery(
    api.userProfiles.queries.getProfileForOrganization,
    activeOrganizationId ? { organizationId: activeOrganizationId } : "skip"
  );
  const organization = useQuery(
    api.organizations.queries.getById,
    activeOrganizationId ? { id: activeOrganizationId } : "skip"
  );

  // When the org context is done loading but there's no active org,
  // the user has no organizations — don't wait on skipped queries.
  const hasNoOrganizations = !orgContextLoading && !activeOrganizationId;
  const isLoading = orgContextLoading || (!hasNoOrganizations && (profile === undefined || organization === undefined));

  return {
    isLoading,
    hasNoOrganizations,
    profile: profile ?? null,
    organization: organization ?? null,
    // Convenience accessors
    organizationId: profile?.organizationId ?? activeOrganizationId ?? undefined,
    role: profile?.role,
    isAdmin: profile?.role === "admin",
    isManager: profile?.role === "admin" || profile?.role === "manager",
    userName: profile?.name,
  };
}

/**
 * Hook for checking if user has a minimum required role
 */
export function useHasRole(requiredRole: "admin" | "manager" | "user"): boolean {
  const { role, isLoading } = useCurrentUser();

  if (isLoading || !role) {
    return false;
  }

  const roleHierarchy: Record<string, number> = {
    admin: 3,
    manager: 2,
    user: 1,
  };

  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

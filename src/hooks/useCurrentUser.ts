import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Hook for accessing the current user's profile and organization
 * Returns loading state, profile data, and organization data
 */
export function useCurrentUser() {
  const profile = useQuery(api.userProfiles.queries.getCurrentProfile);
  const organization = useQuery(api.organizations.queries.getCurrentUserOrganization);

  const isLoading = profile === undefined || organization === undefined;

  return {
    isLoading,
    profile,
    organization,
    // Convenience accessors
    organizationId: profile?.organizationId,
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

import { useCurrentUser } from "./useCurrentUser";
import {
  isModuleAllowedForOrg,
  resolvePlanAccess,
  type OrganizationPlanFields,
} from "@/lib/planStatus";

export type ModuleName = "contracts" | "documents" | "exporting" | "jobs";

/**
 * Returns whether the given add-on module is enabled for the current user's organization.
 */
export function useModuleEnabled(moduleName: ModuleName): boolean {
  const { organization } = useCurrentUser();
  const enabled =
    organization?.settings?.enabledModules?.[moduleName] === true;
  if (!enabled) return false;
  return isModuleAllowedForOrg(organization as OrganizationPlanFields, moduleName);
}

/**
 * Returns whether the org is entitled to enable a module (plan / allowedModules).
 */
export function useModuleAllowed(moduleName: ModuleName): boolean {
  const { organization } = useCurrentUser();
  return isModuleAllowedForOrg(organization as OrganizationPlanFields, moduleName);
}

/**
 * Plan status for the active organization (trial, active, expired, lockout).
 */
export function usePlanStatus() {
  const { organization, isLoading } = useCurrentUser();
  const access = resolvePlanAccess(organization as OrganizationPlanFields);

  return {
    isLoading,
    organization,
    trialEndsAt: organization?.trialEndsAt,
    ...access,
  };
}

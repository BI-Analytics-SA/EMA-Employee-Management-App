import type { ModuleName } from "@/hooks/useModuleEnabled";

export type PlanStatus = "trial" | "active" | "expired";

export type OrganizationPlanFields = {
  planStatus?: PlanStatus;
  trialEndsAt?: number;
  settings?: {
    allowedModules?: Partial<Record<ModuleName, boolean>>;
    enabledModules?: Partial<Record<ModuleName, boolean>>;
  };
};

export function resolvePlanAccess(org: OrganizationPlanFields | null | undefined) {
  if (!org) {
    return {
      planStatus: undefined as PlanStatus | undefined,
      isLocked: true,
      isTrial: false,
      isActive: false,
      trialDaysRemaining: 0,
    };
  }

  const status = org.planStatus;
  const now = Date.now();

  if (status === undefined || status === "active") {
    return {
      planStatus: status,
      isLocked: false,
      isTrial: false,
      isActive: true,
      trialDaysRemaining: 0,
    };
  }

  if (status === "expired") {
    return {
      planStatus: status,
      isLocked: true,
      isTrial: false,
      isActive: false,
      trialDaysRemaining: 0,
    };
  }

  if (status === "trial") {
    const ends = org.trialEndsAt ?? 0;
    if (ends > now) {
      const trialDaysRemaining = Math.max(
        0,
        Math.ceil((ends - now) / (24 * 60 * 60 * 1000))
      );
      return {
        planStatus: status,
        isLocked: false,
        isTrial: true,
        isActive: false,
        trialDaysRemaining,
      };
    }
    return {
      planStatus: status,
      isLocked: true,
      isTrial: false,
      isActive: false,
      trialDaysRemaining: 0,
    };
  }

  return {
    planStatus: status,
    isLocked: true,
    isTrial: false,
    isActive: false,
    trialDaysRemaining: 0,
  };
}

export function isModuleAllowedForOrg(
  org: OrganizationPlanFields | null | undefined,
  moduleName: ModuleName
): boolean {
  const access = resolvePlanAccess(org);
  if (access.isLocked) return false;
  if (access.isTrial || org?.planStatus === undefined) return true;
  if (access.isActive) {
    const allowed = org?.settings?.allowedModules;
    if (!allowed) return true;
    return allowed[moduleName] === true;
  }
  return false;
}

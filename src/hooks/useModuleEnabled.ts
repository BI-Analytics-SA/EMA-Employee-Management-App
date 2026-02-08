import { useCurrentUser } from "./useCurrentUser";

export type ModuleName = "contracts" | "medical" | "documents" | "exporting";

/**
 * Returns whether the given add-on module is enabled for the current user's organization.
 */
export function useModuleEnabled(moduleName: ModuleName): boolean {
  const { organization } = useCurrentUser();
  return organization?.settings?.enabledModules?.[moduleName] === true;
}

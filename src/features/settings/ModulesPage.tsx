import { useState } from "react";
import { useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useModuleAllowed,
  usePlanStatus,
  type ModuleName,
} from "@/hooks/useModuleEnabled";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";

const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-4 py-3 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-4";

const MODULE_CONFIG: { name: ModuleName; label: string; description: string }[] = [
  { name: "contracts", label: "Contracts", description: "Employee contracts with signature capture." },
  { name: "documents", label: "Documents", description: "Document uploads, expiry tracking, and document type management." },
  { name: "exporting", label: "Export to Excel", description: "Export employee data to Excel with configurable columns." },
  { name: "jobs", label: "Jobs", description: "Work order management with document assignments." },
];

export function ModulesPage() {
  const { isAdmin, isLoading: userLoading, organizationId, hasNoOrganizations, organization } =
    useCurrentUser();
  const { isTrial } = usePlanStatus();
  const contractsAllowed = useModuleAllowed("contracts");
  const documentsAllowed = useModuleAllowed("documents");
  const exportingAllowed = useModuleAllowed("exporting");
  const jobsAllowed = useModuleAllowed("jobs");
  const toggleModule = useMutation(api.organizations.mutations.toggleModule);
  const [toggling, setToggling] = useState<ModuleName | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const allowedModules: Record<ModuleName, boolean> = {
    contracts: contractsAllowed,
    documents: documentsAllowed,
    exporting: exportingAllowed,
    jobs: jobsAllowed,
  };

  const enabledModules: Record<ModuleName, boolean> = {
    contracts: organization?.settings?.enabledModules?.contracts === true,
    documents: organization?.settings?.enabledModules?.documents === true,
    exporting: organization?.settings?.enabledModules?.exporting === true,
    jobs: organization?.settings?.enabledModules?.jobs === true,
  };

  const handleToggle = async (moduleName: ModuleName, enabled: boolean) => {
    if (!organizationId) return;
    setToggling(moduleName);
    setToggleError(null);
    try {
      await toggleModule({ organizationId, moduleName, enabled });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Failed to update "${moduleName}" module.`;
      setToggleError(message);
    } finally {
      setToggling(null);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasNoOrganizations || !organizationId) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">
          You need to belong to an organization to manage modules.{" "}
          <Link to="/organizations/new" className="text-primary underline">
            Create or join an organization
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-destructive">Only organization admins can manage modules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Add-on modules</h1>
      <p className="text-muted-foreground text-sm">
        {isTrial
          ? "Your free trial includes all add-on modules. Enable or disable them for your organization."
          : "Enable or disable optional modules for your organization. When disabled, the feature is hidden from all users."}
      </p>

      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <h2 className={sectionTitleClass}>Modules</h2>
        </div>
        <div className={`${sectionContentClass} space-y-4`}>
          {MODULE_CONFIG.map(({ name, label, description }) => {
            const allowed = allowedModules[name];
            const enabled = enabledModules[name];
            const canToggleOn = allowed || isTrial;
            const toggleDisabled =
              toggling === name || (!canToggleOn && !enabled);

            return (
              <div key={name} className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`module-${name}`}
                      className={`text-base font-medium ${!allowed && !isTrial ? "text-muted-foreground" : ""}`}
                    >
                      {label}
                    </Label>
                    {!allowed && !isTrial && (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                  {!allowed && !isTrial && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Not included in your plan — contact us to add this module.
                    </p>
                  )}
                </div>
                <label
                  className={`relative inline-flex items-center shrink-0 ${toggleDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <input
                    id={`module-${name}`}
                    type="checkbox"
                    checked={enabled}
                    disabled={toggleDisabled}
                    onChange={(e) => handleToggle(name, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-muted-foreground/20 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
                </label>
              </div>
            );
          })}
          {toggling && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </p>
          )}
          {toggleError && (
            <p className="text-sm text-destructive">{toggleError}</p>
          )}
        </div>
      </section>
    </div>
  );
}

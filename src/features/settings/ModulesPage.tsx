import { useState } from "react";
import { useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled, type ModuleName } from "@/hooks/useModuleEnabled";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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
  const { isAdmin, isLoading: userLoading, organizationId, hasNoOrganizations } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const documentsEnabled = useModuleEnabled("documents");
  const exportingEnabled = useModuleEnabled("exporting");
  const jobsEnabled = useModuleEnabled("jobs");
  const toggleModule = useMutation(api.organizations.mutations.toggleModule);
  const [toggling, setToggling] = useState<ModuleName | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const enabledModules: Record<ModuleName, boolean> = {
    contracts: contractsEnabled,
    documents: documentsEnabled,
    exporting: exportingEnabled,
    jobs: jobsEnabled,
  };

  const handleToggle = async (moduleName: ModuleName, enabled: boolean) => {
    if (!organizationId) return;
    setToggling(moduleName);
    setToggleError(null);
    try {
      await toggleModule({ organizationId, moduleName, enabled });
    } catch {
      setToggleError(`Failed to update "${moduleName}" module. Please try again.`);
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
        Enable or disable optional modules for your organization. When disabled, the feature is hidden from all users.
      </p>

      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <h2 className={sectionTitleClass}>Modules</h2>
        </div>
        <div className={`${sectionContentClass} space-y-4`}>
          {MODULE_CONFIG.map(({ name, label, description }) => (
            <div key={name} className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={`module-${name}`} className="text-base font-medium">{label}</Label>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id={`module-${name}`}
                  type="checkbox"
                  checked={enabledModules[name]}
                  disabled={toggling === name}
                  onChange={(e) => handleToggle(name, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-muted-foreground/20 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
              </label>
            </div>
          ))}
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

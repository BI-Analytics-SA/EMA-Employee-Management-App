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

export function ModulesPage() {
  const { isAdmin, isLoading: userLoading, organizationId, hasNoOrganizations } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const documentsEnabled = useModuleEnabled("documents");
  const exportingEnabled = useModuleEnabled("exporting");
  const jobsEnabled = useModuleEnabled("jobs");
  const toggleModule = useMutation(api.organizations.mutations.toggleModule);
  const [toggling, setToggling] = useState<ModuleName | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="module-contracts" className="text-base font-medium">Contracts</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Employee contracts with signature capture.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="module-contracts"
                type="checkbox"
                checked={contractsEnabled}
                disabled={toggling === "contracts"}
                onChange={(e) => handleToggle("contracts", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-muted-foreground/20 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
            </label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="module-documents" className="text-base font-medium">Documents</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Document uploads, expiry tracking, and document type management.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="module-documents"
                type="checkbox"
                checked={documentsEnabled}
                disabled={toggling === "documents"}
                onChange={(e) => handleToggle("documents", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-muted-foreground/20 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
            </label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="module-exporting" className="text-base font-medium">Export to Excel</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Export employee data to Excel with configurable columns.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="module-exporting"
                type="checkbox"
                checked={exportingEnabled}
                disabled={toggling === "exporting"}
                onChange={(e) => handleToggle("exporting", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-muted-foreground/20 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
            </label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="module-jobs" className="text-base font-medium">Jobs</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Work order management with document assignments.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="module-jobs"
                type="checkbox"
                checked={jobsEnabled}
                disabled={toggling === "jobs"}
                onChange={(e) => handleToggle("jobs", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-muted-foreground/20 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50" />
            </label>
          </div>
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

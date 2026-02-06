import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-3 py-2 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-4";

export function ModulesPage() {
  const { isAdmin, isLoading: userLoading } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const medicalEnabled = useModuleEnabled("medical");
  const organization = useQuery(api.organizations.queries.getCurrentUserOrganization, undefined);
  const toggleModule = useMutation(api.organizations.mutations.toggleModule);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (moduleName: "contracts" | "medical", enabled: boolean) => {
    setToggling(moduleName);
    try {
      await toggleModule({ moduleName, enabled });
    } finally {
      setToggling(null);
    }
  };

  if (userLoading || organization === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
    <div className="p-4 space-y-4">
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
              <Label htmlFor="module-medical" className="text-base font-medium">Medical questionnaire</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Health questionnaires with employee and nurse signatures.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="module-medical"
                type="checkbox"
                checked={medicalEnabled}
                disabled={toggling === "medical"}
                onChange={(e) => handleToggle("medical", e.target.checked)}
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
        </div>
      </section>
    </div>
  );
}

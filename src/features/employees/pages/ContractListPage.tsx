import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser, useHasRole } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { getEffectiveTemplates } from "@/lib/contractTemplates";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText, Plus, FileCheck, Trash2 } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { timestampToDateString } from "@/lib/validations/contract";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

export function ContractListPage() {
  const { id } = useParams<{ id: string }>();
  const { organization, isLoading: userLoading } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const canManageContracts = useHasRole("manager");
  const employeeId = id as Id<"employees"> | undefined;
  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const contracts = useQuery(
    api.contracts.queries.listByEmployee,
    employeeId ? { employeeId } : "skip"
  );
  const templates = useMemo(() => getEffectiveTemplates(organization ?? undefined), [organization]);
  const removeContract = useMutation(api.contracts.mutations.remove);
  const [deletingId, setDeletingId] = useState<Id<"contracts"> | null>(null);

  function getTemplateName(templateId: string | undefined): string {
    if (!templateId) return "Default";
    return templates.find((t) => t.id === templateId)?.name ?? "Default";
  }

  if (userLoading || !employeeId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (employee === undefined || contracts === undefined) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (employee === null) {
    return (
      <div className="p-4">
        <p className="text-destructive">Employee not found.</p>
        <Link to="/employees">
          <Button variant="link" className="mt-2">Back to list</Button>
        </Link>
      </div>
    );
  }

  if (!contractsEnabled) {
    return (
      <div className="p-4 space-y-4">
        <Link to={`/employees/${employeeId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <p className="text-muted-foreground">The Contracts module is not enabled for your organization.</p>
      </div>
    );
  }

  const displayName = `${TITLES[employee.title] ?? employee.title} ${employee.firstName} ${employee.lastName}`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Link to={`/employees/${employeeId}`} className="shrink-0">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold break-words min-w-0 flex-1">{displayName}</h1>
        </div>
        {canManageContracts && (
          <div className="w-full min-w-0 sm:w-auto flex flex-wrap gap-2">
            <Button size="sm" className="w-full sm:w-auto" asChild>
              <Link to={`/employees/${employeeId}/contracts/new`}>
                <Plus className="h-4 w-4 mr-1" />
                New contract
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-muted/70 px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Contracts</h2>
        </div>
        <div className="p-4">
          {contracts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No contracts yet.</p>
          ) : (
            <ul className="space-y-2">
              {contracts.map((c) => (
                <li
                  key={c._id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border p-3 group"
                >
                  <Link
                    to={`/employees/${employeeId}/contracts/${c._id}`}
                    className="flex flex-wrap items-center gap-2 min-w-0 flex-1"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Signed {timestampToDateString(c.signedDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Start: {timestampToDateString(c.startDate)}
                        <span className="ml-1.5">
                          · Template: {getTemplateName(c.templateId)}
                        </span>
                      </p>
                    </div>
                    {c.pdfUrl ? (
                      <span className="text-xs text-success flex items-center gap-0.5" title="PDF generated">
                        <FileCheck className="h-3.5 w-3.5" /> PDF
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No PDF</span>
                    )}
                    {c.signatureUrl ? (
                      <span className="text-xs text-muted-foreground">Signed</span>
                    ) : (
                      <span className="text-xs text-warning">No signature</span>
                    )}
                  </Link>
                  {canManageContracts && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!confirm("Delete this contract?")) return;
                        setDeletingId(c._id);
                        try {
                          await removeContract({ id: c._id });
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === c._id}
                    >
                      {deletingId === c._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

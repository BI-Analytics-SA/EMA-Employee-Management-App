import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteEmployeeDialogProps {
  employeeId: Id<"employees">;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteEmployeeDialog({
  employeeId,
  employeeName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteEmployeeDialogProps) {
  const removeMutation = useMutation(api.employees.mutations.remove);
  const counts = useQuery(
    api.employees.queries.getAssociatedCounts,
    open ? { employeeId } : "skip"
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAssociatedData =
    counts !== undefined && (counts.documents > 0 || counts.contracts > 0);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await removeMutation({ id: employeeId });
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      console.error("Failed to delete employee:", err);
      setError("Failed to delete employee. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-employee-dialog-title"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !isDeleting) onOpenChange(false);
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle id="delete-employee-dialog-title" className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Employee
          </CardTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
            disabled={isDeleting}
            aria-label="Close"
          >
            ×
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will permanently delete{" "}
            <strong>{employeeName}</strong> and all associated data.
            This cannot be undone.
          </p>

          {hasAssociatedData && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <p className="text-sm font-medium">
                The following associated data will also be deleted:
              </p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {counts.documents > 0 && (
                  <li>
                    {counts.documents} document{counts.documents !== 1 ? "s" : ""} and{" "}
                    {counts.documents !== 1 ? "their" : "its"} files
                  </li>
                )}
                {counts.contracts > 0 && (
                  <li>
                    {counts.contracts} contract{counts.contracts !== 1 ? "s" : ""} and{" "}
                    {counts.contracts !== 1 ? "their" : "its"} signature/PDF files
                  </li>
                )}
              </ul>
              <p className="text-xs text-muted-foreground italic">
                You may want to download or export files before proceeding.
              </p>
            </div>
          )}

          {counts === undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking for associated data...
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <div className="w-full min-w-0 sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
            <div className="w-full min-w-0 sm:w-auto">
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={handleDelete}
                disabled={isDeleting || counts === undefined}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

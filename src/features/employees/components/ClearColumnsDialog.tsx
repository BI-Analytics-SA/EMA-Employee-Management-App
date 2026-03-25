import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { extractConvexError } from "@/lib/convex-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eraser, Loader2 } from "lucide-react";
import {
  getColumnsByCategory,
  getCategoryLabel,
  type ClearableColumnCategory,
  type ClearableColumnDef,
} from "../constants/clearableColumns";
import { cn } from "@/lib/utils";

const CONFIRM_TEXT = "CLEAR";

interface ClearColumnsDialogProps {
  organizationId: Id<"organizations">;
}

export function ClearColumnsDialog({ organizationId }: ClearColumnsDialogProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const bulkClearColumns = useMutation(api.employees.mutations.bulkClearColumns);

  const columnsByCategory = useMemo(() => getColumnsByCategory(), []);
  const selectedCount = selectedIds.size;

  function toggleColumn(col: ClearableColumnDef) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(col.id)) next.delete(col.id);
      else next.add(col.id);
      return next;
    });
  }

  function toggleCategory(category: ClearableColumnCategory, select: boolean) {
    const cols = columnsByCategory.get(category) ?? [];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      cols.forEach((c) => (select ? next.add(c.id) : next.delete(c.id)));
      return next;
    });
  }

  function openConfirm() {
    if (selectedCount === 0) return;
    setConfirmInput("");
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmInput("");
  }

  async function handleConfirmClear() {
    if (confirmInput.trim() !== CONFIRM_TEXT || selectedCount === 0) return;
    setIsClearing(true);
    try {
      const result = await bulkClearColumns({
        organizationId,
        columns: Array.from(selectedIds),
      });
      closeConfirm();
      setSheetOpen(false);
      setSelectedIds(new Set());
      window.alert(
        `Cleared ${result.updated} of ${result.total} employee record(s) for the selected columns.`
      );
    } catch (err) {
      window.alert(extractConvexError(err, "Failed to clear column data."));
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="w-full lg:w-auto"
        onClick={() => setSheetOpen(true)}
        title="Clear data in selected columns for all employees"
      >
        <Eraser className="h-4 w-4" />
        Clear Data
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="right" className="w-96">
        <SheetContent className="flex flex-col">
          <h3 className="text-lg font-semibold">Clear column data</h3>
          <p className="text-sm text-muted-foreground">
            Select columns to clear for all employees in this organization. ID
            Number and other protected fields are not available.
          </p>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {Array.from(columnsByCategory.entries()).map(
              ([category, columns]) => {
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {getCategoryLabel(category)}
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => toggleCategory(category, true)}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => toggleCategory(category, false)}
                        >
                          None
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {columns.map((col) => {
                        const checked = selectedIds.has(col.id);
                        return (
                          <label
                            key={col.id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors",
                              checked
                                ? "bg-destructive/10 border-destructive/30"
                                : "bg-muted/30 border-transparent"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleColumn(col)}
                              className="h-4 w-4 rounded border-input"
                            />
                            <span className="text-sm font-medium">
                              {col.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            {selectedCount > 0 && (
              <p className="text-sm font-medium text-destructive">
                {selectedCount} column{selectedCount !== 1 ? "s" : ""} selected
              </p>
            )}
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={selectedCount === 0}
              onClick={openConfirm}
            >
              Clear selected columns
            </Button>
            <p className="text-xs text-muted-foreground">
              You will be asked to confirm before any data is cleared.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Confirm clear column data</CardTitle>
              <button
                type="button"
                onClick={closeConfirm}
                className="text-muted-foreground hover:text-foreground"
                disabled={isClearing}
              >
                ×
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will permanently erase data in{" "}
                <strong>{selectedCount}</strong> column
                {selectedCount !== 1 ? "s" : ""} for all employees in this
                organization. This cannot be undone.
              </p>
              <p className="text-sm text-muted-foreground">
                Type <strong>{CONFIRM_TEXT}</strong> to confirm.
              </p>
              <div className="space-y-2">
                <Label htmlFor="clearConfirmInput">Confirmation</Label>
                <Input
                  id="clearConfirmInput"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={CONFIRM_TEXT}
                  disabled={isClearing}
                  className="font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <div className="w-full min-w-0 sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={closeConfirm}
                    disabled={isClearing}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="w-full min-w-0 sm:w-auto">
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={handleConfirmClear}
                    disabled={
                      confirmInput.trim() !== CONFIRM_TEXT || isClearing
                    }
                  >
                    {isClearing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Clear data"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

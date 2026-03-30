import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LayoutList } from "lucide-react";
import {
  EMPLOYEE_REPORT_COLUMNS,
  type EmployeeReportColumnDef,
} from "../constants/employeeReportColumns";
import { cn } from "@/lib/utils";

interface ColumnPickerProps {
  reportId: string;
  onColumnsChange?: (columnIds: string[]) => void;
  /** Applied immediately when user toggles (optimistic); still persisted to Convex */
  selectedColumnIds: string[];
  onSelectedColumnIdsChange: (columnIds: string[]) => void;
}

export function ColumnPicker({
  reportId,
  selectedColumnIds,
  onSelectedColumnIdsChange,
  onColumnsChange,
}: ColumnPickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const setPreferences = useMutation(api.reportPreferences.mutations.setReportColumnPreferences);

  const effectiveSelected = selectedColumnIds;

  function toggleColumn(col: EmployeeReportColumnDef) {
    const isCurrentlySelected = effectiveSelected.includes(col.id);
    let next: string[];
    if (isCurrentlySelected) {
      const without = effectiveSelected.filter((id) => id !== col.id);
      next = without.length > 0 ? without : effectiveSelected;
    } else {
      next = [...effectiveSelected, col.id];
    }
    onSelectedColumnIdsChange(next);
    onColumnsChange?.(next);
    setPreferences({ reportId, columnIds: next }).catch(console.error);
  }

  function handleClearAll() {
    onSelectedColumnIdsChange([]);
    onColumnsChange?.([]);
    setPreferences({ reportId, columnIds: [] }).catch(console.error);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setSheetOpen(true)}
        title="Choose columns"
      >
        <LayoutList className="h-4 w-4" />
        Columns
      </Button>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="right">
        <SheetContent className="min-w-[280px]">
          <h3 className="text-lg font-semibold mb-1">Choose columns</h3>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={effectiveSelected.length === 0}
            className="text-xs font-medium text-destructive hover:text-destructive/70 disabled:opacity-40 disabled:pointer-events-none mb-4 block text-left underline underline-offset-2"
          >
            Clear selections
          </button>
          <div className="flex flex-col gap-2">
            {EMPLOYEE_REPORT_COLUMNS.map((col) => {
              const checked = effectiveSelected.includes(col.id);
              return (
                <label
                  key={col.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors",
                    checked ? "bg-accent/10 border-accent/30" : "bg-muted/30 border-transparent"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleColumn(col)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm font-medium">{col.label}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            At least one column must be selected. Your choice is saved automatically.
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
}

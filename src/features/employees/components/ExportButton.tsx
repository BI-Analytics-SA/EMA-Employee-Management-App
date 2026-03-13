import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileDown, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import type { ExportColumn } from "@/features/settings/ExportConfigPage";
import {
  DEFAULT_DATABASE_COLUMNS,
  mergeExportColumns,
} from "@/features/settings/ExportConfigPage";

function formatDate(ts: number | undefined): string {
  if (ts == null || ts === 0) return "";
  return new Date(ts).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function cellValue(
  employee: Record<string, unknown>,
  col: ExportColumn
): string | number {
  if (col.source === "custom") {
    const raw = col.defaultValue ?? "";
    if (col.dataType === "number") {
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    if (col.dataType === "date") return raw;
    return raw;
  }
  const raw = col.dbField ? employee[col.dbField] : undefined;
  if (raw === undefined || raw === null) return "";
  if (col.dataType === "date" && typeof raw === "number") {
    return formatDate(raw);
  }
  if (col.dataType === "number" && typeof raw === "number") return raw;
  return String(raw);
}

type ExportButtonProps = { className?: string };

export function ExportButton({ className }: ExportButtonProps) {
  const { organizationId, organization, isLoading: userLoading } = useCurrentUser();
  const employees = useQuery(
    api.employees.queries.listAll,
    organizationId ? { organizationId } : "skip"
  );
  const [exporting, setExporting] = useState(false);

  const configColumns = organization?.settings?.exportConfig?.columns as
    | ExportColumn[]
    | undefined;
  const resolvedColumns = mergeExportColumns(DEFAULT_DATABASE_COLUMNS, configColumns);
  const columns: ExportColumn[] = resolvedColumns.filter((c) => c.enabled);

  const handleExport = useCallback(() => {
    if (!employees || employees.length === 0) return;
    setExporting(true);
    try {
      const headers = columns.map((c) => c.label);
      const rows = employees.map((emp) =>
        columns.map((col) => cellValue(emp as Record<string, unknown>, col))
      );
      const data = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      XLSX.writeFile(wb, "employees.xlsx");
    } finally {
      setExporting(false);
    }
  }, [employees, columns]);

  if (userLoading || !organization) return null;

  const canExport = employees && employees.length > 0 && columns.length > 0;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={!canExport || exporting}
      className={cn(className)}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <FileDown className="h-4 w-4 mr-1" />
      )}
      Export to Excel
    </Button>
  );
}

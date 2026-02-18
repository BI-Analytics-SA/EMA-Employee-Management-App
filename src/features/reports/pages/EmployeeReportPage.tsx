import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Pencil, Search, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { ColumnPicker } from "../components/ColumnPicker";
import {
  getVisibleColumnIds,
  DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS,
  EMPLOYEE_REPORT_COLUMNS,
} from "../constants/employeeReportColumns";
import type { Doc } from "../../../../convex/_generated/dataModel";

const REPORT_ID_EMPLOYEES = "employees";

export function EmployeeReportPage() {
  const { organizationId, isLoading: userLoading } = useCurrentUser();
  const employees = useQuery(
    api.employees.queries.listAll,
    organizationId ? { organizationId } : "skip"
  );
  const savedColumnIds = useQuery(
    api.reportPreferences.queries.getReportColumnPreferences,
    { reportId: REPORT_ID_EMPLOYEES }
  );

  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const hasInitializedFromConvex = useRef(false);

  useEffect(() => {
    if (savedColumnIds !== undefined && !hasInitializedFromConvex.current) {
      setSelectedColumnIds(getVisibleColumnIds(savedColumnIds));
      hasInitializedFromConvex.current = true;
    }
  }, [savedColumnIds]);

  const effectiveColumnIds =
    selectedColumnIds.length > 0
      ? selectedColumnIds
      : savedColumnIds !== undefined
        ? getVisibleColumnIds(savedColumnIds)
        : DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS;

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) =>
      effectiveColumnIds.some((colId) => {
        const col = EMPLOYEE_REPORT_COLUMNS.find((c) => c.id === colId);
        const value = col?.getValue(emp);
        const str = value != null ? String(value).toLowerCase() : "";
        return str.includes(q);
      })
    );
  }, [employees, searchQuery, effectiveColumnIds]);

  const [exporting, setExporting] = useState(false);
  const handleExportToExcel = useCallback(() => {
    if (filteredEmployees.length === 0) return;
    setExporting(true);
    try {
      const headers = effectiveColumnIds.map(
        (colId) => EMPLOYEE_REPORT_COLUMNS.find((c) => c.id === colId)?.label ?? colId
      );
      const rows = filteredEmployees.map((emp: Doc<"employees">) =>
        effectiveColumnIds.map((colId) => {
          const col = EMPLOYEE_REPORT_COLUMNS.find((c) => c.id === colId);
          const value = col?.getValue(emp);
          return value != null ? String(value) : "";
        })
      );
      const data = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employee Report");
      XLSX.writeFile(wb, "employee-report.xlsx");
    } finally {
      setExporting(false);
    }
  }, [filteredEmployees, effectiveColumnIds]);

  if (userLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Employee Report</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search table…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search report table"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportToExcel}
            disabled={!employees?.length || filteredEmployees.length === 0 || exporting}
            title="Export visible columns to Excel"
            className="gap-1.5"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export to Excel
          </Button>
          <ColumnPicker
            reportId={REPORT_ID_EMPLOYEES}
            savedColumnIds={savedColumnIds ?? null}
            selectedColumnIds={selectedColumnIds}
            onSelectedColumnIdsChange={setSelectedColumnIds}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Choose columns to show; your selection is saved. Use Edit to open the employee form.
      </p>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {employees === undefined ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No employees to show.</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No matches for your search.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {effectiveColumnIds.map((colId) => {
                      const col = EMPLOYEE_REPORT_COLUMNS.find((c) => c.id === colId);
                      return (
                        <th key={colId} className="px-4 py-3">
                          {col?.label ?? colId}
                        </th>
                      );
                    })}
                    <th className="w-24 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-muted/30 transition-colors">
                      {effectiveColumnIds.map((colId) => {
                        const col = EMPLOYEE_REPORT_COLUMNS.find((c) => c.id === colId);
                        const value = col?.getValue(emp);
                        return (
                          <td key={colId} className="px-4 py-3 truncate max-w-[12rem]">
                            {value != null ? String(value) : "—"}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <Link to={`/employees/${emp._id}/edit?returnTo=${encodeURIComponent("/reports/employees")}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { REPORT_ID_EMPLOYEES };

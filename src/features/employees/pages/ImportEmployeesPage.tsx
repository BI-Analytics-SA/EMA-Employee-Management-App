import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { extractConvexError } from "@/lib/convex-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { generateImportTemplate, parseImportFile, IMPORT_COLUMNS } from "@/features/employees/utils/importTemplate";
import {
  validateImportRows,
  classifyRows,
  type ValidatedRow,
  type ImportError,
} from "@/features/employees/utils/importValidation";

const BATCH_SIZE = 50;

type Step = 1 | 2 | 3;

type PreviewRow =
  | { type: "create"; validated: ValidatedRow }
  | { type: "update"; validated: ValidatedRow }
  | { type: "error"; rowIndex: number; error: ImportError };

export function ImportEmployeesPage() {
  const { organizationId, isLoading: userLoading } = useCurrentUser();
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [validRows, setValidRows] = useState<ValidatedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [unmatchedColumns, setUnmatchedColumns] = useState<string[]>([]);
  const [matchedFields, setMatchedFields] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<"error" | "new" | "update">("error");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  const existingIdNumbers = useQuery(
    api.employees.import.getEmployeeIdNumbers,
    organizationId ? { organizationId } : "skip"
  );
  const bulkUpsert = useMutation(api.employees.import.bulkUpsertEmployees);

  const { toCreate, toUpdate } = useMemo(() => {
    if (!validRows.length || !existingIdNumbers) return { toCreate: [], toUpdate: [] };
    return classifyRows(validRows, existingIdNumbers);
  }, [validRows, existingIdNumbers]);

  const summary = useMemo(() => ({
    createCount: toCreate.length,
    updateCount: toUpdate.length,
    errorCount: validationErrors.length,
  }), [toCreate.length, toUpdate.length, validationErrors.length]);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setParseError(null);
      setValidRows([]);
      setValidationErrors([]);
      setPreviewRows([]);
      setImportResult(null);
      setUnmatchedColumns([]);
      setMatchedFields([]);
      try {
        const result = await parseImportFile(selectedFile);
        setRawRows(result.rows);
        setUnmatchedColumns(result.unmatchedColumns);
        setMatchedFields(result.matchedFields);
        const { valid, errors } = validateImportRows(result.rows);
        setValidRows(valid);
        setValidationErrors(errors);
      } catch (err) {
        setParseError(extractConvexError(err, "Failed to parse file"));
        setRawRows([]);
      }
    },
    []
  );

  const buildPreviewRows = useCallback(() => {
    const rows: PreviewRow[] = [];
    for (const e of validationErrors) {
      rows.push({ type: "error", rowIndex: e.row, error: e });
    }
    for (const v of validRows) {
      const existing = existingIdNumbers?.find((e) => e.idNumber === v.data.idNumber);
      if (existing) {
        rows.push({ type: "update", validated: v });
      } else {
        rows.push({ type: "create", validated: v });
      }
    }
    rows.sort((a, b) => {
      const rowA = a.type === "error" ? a.rowIndex : a.validated.rowIndex;
      const rowB = b.type === "error" ? b.rowIndex : b.validated.rowIndex;
      return rowA - rowB;
    });
    setPreviewRows(rows);
  }, [validRows, validationErrors, existingIdNumbers]);

  useEffect(() => {
    if (step === 2 && validRows.length > 0) {
      buildPreviewRows();
    }
  }, [step, validRows, validationErrors, existingIdNumbers, buildPreviewRows]);

  const handleGoToPreview = useCallback(() => {
    setFilterStatus(validationErrors.length > 0 ? "error" : "new");
    setStep(2);
  }, [validationErrors.length]);

  const runImport = useCallback(async () => {
    if (!organizationId) return;
    setImporting(true);
    const createItems = toCreate.map((v) => ({ mode: "create" as const, ...v.data }));
    const updateItems = toUpdate.map(({ validated }) => ({ mode: "update" as const, ...validated.data }));
    const batchItems = [...createItems, ...updateItems];
    const rowIndexByBatchIndex = [
      ...toCreate.map((v) => v.rowIndex),
      ...toUpdate.map(({ validated }) => validated.rowIndex),
    ];
    const totalBatches = Math.ceil(batchItems.length / BATCH_SIZE);
    setImportProgress({ current: 0, total: totalBatches });
    setImportResult(null);

    let created = 0;
    let updated = 0;
    const allErrors: { row: number; message: string }[] = [];

    for (let i = 0; i < batchItems.length; i += BATCH_SIZE) {
      const batch = batchItems.slice(i, i + BATCH_SIZE);
      const result = await bulkUpsert({
        organizationId: organizationId as Id<"organizations">,
        batch,
      });
      created += result.created;
      updated += result.updated;
      result.errors.forEach((e) => {
        const batchIdx = e.row - 1;
        const globalIdx = i + batchIdx;
        const fileRow = rowIndexByBatchIndex[globalIdx] ?? e.row;
        allErrors.push({ row: fileRow, message: e.message });
      });
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      setImportProgress({ current: batchNum, total: totalBatches });
    }

    setImportResult({
      created,
      updated,
      errors: allErrors,
    });
    setImporting(false);
    setStep(3);
  }, [organizationId, toCreate, toUpdate, bulkUpsert]);

  const filteredPreviewRows = useMemo(() => {
    const MAX_NEW_UPDATE = 20;
    const filtered = previewRows.filter((r) => {
      if (r.type === "error") return filterStatus === "error";
      if (r.type === "create") return filterStatus === "new";
      if (r.type === "update") return filterStatus === "update";
      return false;
    });
    if (filterStatus === "error") return filtered;
    return filtered.slice(0, MAX_NEW_UPDATE);
  }, [previewRows, filterStatus]);

  if (userLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Import Employees</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={step >= 1 ? "font-medium text-foreground" : ""}>1. Upload</span>
        <ArrowRight className="h-4 w-4" />
        <span className={step >= 2 ? "font-medium text-foreground" : ""}>2. Preview</span>
        <ArrowRight className="h-4 w-4" />
        <span className={step >= 3 ? "font-medium text-foreground" : ""}>3. Result</span>
      </div>

      {step === 1 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Upload file
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" onClick={generateImportTemplate}>
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("border-primary");
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-primary");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-primary");
                  const f = e.dataTransfer.files?.[0];
                  if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv"))) {
                    handleFileSelect(f);
                  } else {
                    setParseError("Please upload an Excel (.xlsx, .xls) or CSV file.");
                  }
                }}
                onClick={() => document.getElementById("import-file-input")?.click()}
              >
                <input
                  id="import-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) handleFileSelect(f);
                  }}
                />
                {file ? (
                  <p className="font-medium text-foreground">{file.name}</p>
                ) : (
                  <p>Drag and drop an Excel or CSV file here, or click to browse.</p>
                )}
                <p className="text-xs mt-2">Use the template to ensure correct column headers.</p>
              </div>
              {parseError && (
                <p className="text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {parseError}
                </p>
              )}
              {file && rawRows.length > 0 && (
                <div className="space-y-3 pt-4">
                  {unmatchedColumns.length > 0 && (
                    <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-3">
                      <p className="font-medium text-yellow-700 dark:text-yellow-400 text-sm mb-1">
                        {unmatchedColumns.length} unrecognised column{unmatchedColumns.length > 1 ? "s" : ""} (will be ignored):
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {unmatchedColumns.join(", ")}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {rawRows.length} row(s) parsed. {validRows.length} valid, {validationErrors.length} with errors.
                    </p>
                    <Button onClick={handleGoToPreview} disabled={validRows.length === 0}>
                      Continue to Preview
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          {/* Column warnings */}
          {(unmatchedColumns.length > 0 || matchedFields.length < IMPORT_COLUMNS.length) && (
            <div className="space-y-2">
              {unmatchedColumns.length > 0 && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-3">
                  <p className="font-medium text-yellow-700 dark:text-yellow-400 text-sm mb-1">
                    Unrecognised columns (ignored):
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {unmatchedColumns.join(", ")}
                  </p>
                </div>
              )}
              {(() => {
                const missingOptional = IMPORT_COLUMNS.filter(
                  (c) => !c.required && !matchedFields.includes(c.field)
                );
                if (missingOptional.length === 0) return null;
                return (
                  <div className="rounded-lg border border-blue-500/50 bg-blue-500/5 p-3">
                    <p className="font-medium text-blue-700 dark:text-blue-400 text-sm mb-1">
                      Optional columns not in file (existing data will not be changed):
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {missingOptional.map((c) => c.label).join(", ")}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15">
                    <UserPlus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.createCount}</p>
                    <p className="text-xs text-muted-foreground">New</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.updateCount}</p>
                    <p className="text-xs text-muted-foreground">Updates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.errorCount}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["error", "new", "update"] as const).map((f) => (
              <Button
                key={f}
                variant={filterStatus === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(f)}
              >
                {f === "error" && `Errors (${summary.errorCount})`}
                {f === "new" && `New (${summary.createCount})`}
                {f === "update" && `Updates (${summary.updateCount})`}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-md">
                {filterStatus === "error" ? (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 w-16">Row</th>
                        <th className="text-left p-2">Field</th>
                        <th className="text-left p-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground">
                            No errors
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((r) => {
                          if (r.type !== "error") return null;
                          return (
                            <tr key={`err-${r.rowIndex}`} className="border-t">
                              <td className="p-2">{r.rowIndex}</td>
                              <td className="p-2 text-muted-foreground">{r.error.field ?? "—"}</td>
                              <td className="p-2 text-destructive">{r.error.message}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 w-16">Row</th>
                        <th className="text-left p-2 w-24">Status</th>
                        <th className="text-left p-2">ID Number</th>
                        <th className="text-left p-2">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            {filterStatus === "new" ? "No new employees" : "No updates"}
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((r) => {
                          if (r.type === "error") return null;
                          const { validated } = r;
                          const row = validated.data;
                          return (
                            <tr key={`${r.type}-${validated.rowIndex}-${row.idNumber}`} className="border-t">
                              <td className="p-2">{validated.rowIndex}</td>
                              <td className="p-2">
                                {r.type === "create" ? (
                                  <span className="text-green-600 font-medium">New</span>
                                ) : (
                                  <span className="text-blue-600 font-medium">Update</span>
                                )}
                              </td>
                              <td className="p-2 font-mono text-xs">{row.idNumber}</td>
                              <td className="p-2">{row.firstName ?? ""} {row.lastName ?? ""}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {filterStatus !== "error" && (() => {
                const total = filterStatus === "new" ? summary.createCount : summary.updateCount;
                if (total > 20) {
                  return (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing 20 of {total}. All {total} will be imported.
                    </p>
                  );
                }
                return null;
              })()}
              {importing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing... batch {importProgress.current} of {importProgress.total}
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(1)} disabled={importing}>
                  Back
                </Button>
                <Button
                  onClick={runImport}
                  disabled={importing || toCreate.length + toUpdate.length === 0}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Confirm and Import
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 3 && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Import complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                <p className="text-sm text-muted-foreground">Created</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                <p className="text-sm text-muted-foreground">Updated</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-destructive">{importResult.errors.length}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <p className="font-medium text-destructive mb-2">Errors during import:</p>
                <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                  {importResult.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button asChild>
                <Link to="/employees">View Employees</Link>
              </Button>
              <Button variant="outline" onClick={() => { setStep(1); setFile(null); setImportResult(null); setRawRows([]); setValidRows([]); setValidationErrors([]); setPreviewRows([]); setUnmatchedColumns([]); setMatchedFields([]); }}>
                Import another file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

export type ExportColumn = {
  id: string;
  source: "database" | "custom";
  dbField?: string;
  label: string;
  dataType: "text" | "number" | "date";
  defaultValue?: string;
  enabled: boolean;
};

export const DEFAULT_DATABASE_COLUMNS: ExportColumn[] = [
  { id: "employeeNo", source: "database", dbField: "employeeNo", label: "Employee No", dataType: "text", enabled: true },
  { id: "idNumber", source: "database", dbField: "idNumber", label: "ID Number", dataType: "text", enabled: true },
  { id: "title", source: "database", dbField: "title", label: "Title", dataType: "text", enabled: true },
  { id: "initials", source: "database", dbField: "initials", label: "Initials", dataType: "text", enabled: true },
  { id: "firstName", source: "database", dbField: "firstName", label: "First Name", dataType: "text", enabled: true },
  { id: "secondName", source: "database", dbField: "secondName", label: "Second Name", dataType: "text", enabled: true },
  { id: "lastName", source: "database", dbField: "lastName", label: "Last Name", dataType: "text", enabled: true },
  { id: "knownAs", source: "database", dbField: "knownAs", label: "Known As", dataType: "text", enabled: true },
  { id: "dateOfBirth", source: "database", dbField: "dateOfBirth", label: "Date of Birth", dataType: "date", enabled: true },
  { id: "gender", source: "database", dbField: "gender", label: "Gender", dataType: "text", enabled: true },
  { id: "ethnicGroup", source: "database", dbField: "ethnicGroup", label: "Ethnic Group", dataType: "text", enabled: true },
  { id: "cellNumber", source: "database", dbField: "cellNumber", label: "Cell Number", dataType: "text", enabled: true },
  { id: "resStreetNo", source: "database", dbField: "resStreetNo", label: "Street No", dataType: "text", enabled: true },
  { id: "resStreetName", source: "database", dbField: "resStreetName", label: "Street Name", dataType: "text", enabled: true },
  { id: "resSuburb", source: "database", dbField: "resSuburb", label: "Suburb", dataType: "text", enabled: true },
  { id: "resCity", source: "database", dbField: "resCity", label: "City", dataType: "text", enabled: true },
  { id: "resPostCode", source: "database", dbField: "resPostCode", label: "Post Code", dataType: "text", enabled: true },
  { id: "dateRegistered", source: "database", dbField: "dateRegistered", label: "Date Registered", dataType: "date", enabled: true },
  { id: "dateEngaged", source: "database", dbField: "dateEngaged", label: "Date Engaged", dataType: "date", enabled: true },
  { id: "taxNumber", source: "database", dbField: "taxNumber", label: "Tax Number", dataType: "text", enabled: true },
  { id: "certificate", source: "database", dbField: "certificate", label: "Certificate", dataType: "text", enabled: true },
  { id: "lastDateWorked", source: "database", dbField: "lastDateWorked", label: "Last Date Worked", dataType: "date", enabled: false },
  { id: "uifEndDate", source: "database", dbField: "uifEndDate", label: "UIF End Date", dataType: "date", enabled: false },
  { id: "language", source: "database", dbField: "language", label: "Language", dataType: "text", enabled: false },
  { id: "alternativeNumber", source: "database", dbField: "alternativeNumber", label: "Alternative Number", dataType: "text", enabled: false },
  { id: "hrsPerPeriod", source: "database", dbField: "hrsPerPeriod", label: "Hours per Period", dataType: "number", enabled: false },
  { id: "hoursPerDay", source: "database", dbField: "hoursPerDay", label: "Hours per Day", dataType: "number", enabled: false },
  { id: "workAddressCode", source: "database", dbField: "workAddressCode", label: "Work Address Code", dataType: "number", enabled: false },
  { id: "resUnit", source: "database", dbField: "resUnit", label: "Res Unit", dataType: "text", enabled: false },
  { id: "resComplex", source: "database", dbField: "resComplex", label: "Res Complex", dataType: "text", enabled: false },
  { id: "residentialCountry", source: "database", dbField: "residentialCountry", label: "Residential Country", dataType: "text", enabled: false },
  { id: "illnessCondition", source: "database", dbField: "illnessCondition", label: "Illness Condition", dataType: "text", enabled: false },
  { id: "payMethod", source: "database", dbField: "payMethod", label: "Pay Method", dataType: "text", enabled: false },
  { id: "bankAccType", source: "database", dbField: "bankAccType", label: "Bank Account Type", dataType: "text", enabled: false },
  { id: "bankAccNo", source: "database", dbField: "bankAccNo", label: "Bank Account No", dataType: "text", enabled: false },
  { id: "bankName", source: "database", dbField: "bankName", label: "Bank Name", dataType: "text", enabled: false },
  { id: "branchCode", source: "database", dbField: "branchCode", label: "Branch Code", dataType: "text", enabled: false },
  { id: "accHolder", source: "database", dbField: "accHolder", label: "Account Holder", dataType: "text", enabled: false },
  { id: "accRelationship", source: "database", dbField: "accRelationship", label: "Account Relationship", dataType: "text", enabled: false },
  { id: "training", source: "database", dbField: "training", label: "Training", dataType: "text", enabled: false },
  { id: "shift", source: "database", dbField: "shift", label: "Shift", dataType: "text", enabled: false },
  { id: "shiftAllocation", source: "database", dbField: "shiftAllocation", label: "Shift Allocation", dataType: "text", enabled: false },
  { id: "deptGroup", source: "database", dbField: "deptGroup", label: "Department Group", dataType: "text", enabled: false },
  { id: "departmentWorked", source: "database", dbField: "departmentWorked", label: "Department Worked", dataType: "text", enabled: false },
  { id: "department", source: "database", dbField: "department", label: "Department", dataType: "text", enabled: false },
  { id: "maritalStatus", source: "database", dbField: "maritalStatus", label: "Marital Status", dataType: "text", enabled: false },
  { id: "taxYearStart", source: "database", dbField: "taxYearStart", label: "Tax Year Start", dataType: "date", enabled: false },
  { id: "newUifStartDate", source: "database", dbField: "newUifStartDate", label: "New UIF Start Date", dataType: "date", enabled: false },
  { id: "repAddr1", source: "database", dbField: "repAddr1", label: "Rep Address 1", dataType: "text", enabled: false },
  { id: "repAddr2", source: "database", dbField: "repAddr2", label: "Rep Address 2", dataType: "text", enabled: false },
  { id: "repAddr3", source: "database", dbField: "repAddr3", label: "Rep Address 3", dataType: "text", enabled: false },
  { id: "repPostCode", source: "database", dbField: "repPostCode", label: "Rep Post Code", dataType: "text", enabled: false },
  { id: "fullNames", source: "database", dbField: "fullNames", label: "Full Names", dataType: "text", enabled: false },
];

/** Merge saved export columns with defaults so new default columns (e.g. bank details) always appear; saved overrides (label, enabled) apply when present. Preserves saved column order; appends any defaults not in saved. */
export function mergeExportColumns(
  defaultCols: ExportColumn[],
  saved: ExportColumn[] | undefined
): ExportColumn[] {
  if (!saved?.length) return defaultCols;
  const defaultById = new Map(defaultCols.map((c) => [c.id, c]));
  const savedIds = new Set(saved.map((c) => c.id));
  const mergedFromSaved = saved.map((s) => {
    const defaultCol = defaultById.get(s.id);
    return defaultCol ? { ...defaultCol, ...s } : s;
  });
  const remainingDefaults = defaultCols.filter((d) => !savedIds.has(d.id));
  return [...mergedFromSaved, ...remainingDefaults];
}

function SortableColumnRow({
  column,
  onUpdate,
  onRemove,
}: {
  column: ExportColumn;
  onUpdate: (id: string, updates: Partial<ExportColumn>) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={column.enabled}
          onChange={(e) => onUpdate(column.id, { enabled: e.target.checked })}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-muted-foreground/20 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
      </label>
      <div className="w-full min-w-0 sm:min-w-[140px] sm:flex-1">
        <Input
          value={column.label}
          onChange={(e) => onUpdate(column.id, { label: e.target.value })}
          placeholder="Column label"
          className="h-10 text-sm"
        />
      </div>
      <span
        className={cn(
          "rounded px-2 py-0.5 text-xs font-medium",
          column.source === "database"
            ? "bg-muted text-muted-foreground"
            : "bg-accent/10 text-accent"
        )}
      >
        {column.source === "database" ? "Database" : "Custom"}
      </span>
      {column.source === "custom" && (
        <>
          <select
            value={column.dataType}
            onChange={(e) =>
              onUpdate(column.id, { dataType: e.target.value as ExportColumn["dataType"] })
            }
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
          <div className="w-full min-w-0 sm:min-w-[120px]">
            <Input
              value={column.defaultValue ?? ""}
              onChange={(e) => onUpdate(column.id, { defaultValue: e.target.value })}
              placeholder="Default value"
              className="h-10 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(column.id)}
            aria-label="Remove column"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export function ExportConfigPage() {
  const { organization, isAdmin, isLoading: userLoading } = useCurrentUser();
  const exportingEnabled = useModuleEnabled("exporting");
  const updateExportConfig = useMutation(api.organizations.mutations.updateExportConfig);
  const backfillBankDefaults = useMutation(api.employees.mutations.backfillBankDefaults);

  const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_DATABASE_COLUMNS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{ updated: number; total: number } | null>(null);
  const [backfillError, setBackfillError] = useState<string | null>(null);

  const savedColumns = organization?.settings?.exportConfig?.columns as
    | ExportColumn[]
    | undefined;

  useEffect(() => {
    setColumns(mergeExportColumns(DEFAULT_DATABASE_COLUMNS, savedColumns));
  }, [savedColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumns((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleUpdate = (id: string, updates: Partial<ExportColumn>) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleRemove = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCustom = () => {
    const id = `custom-${Date.now()}`;
    setColumns((prev) => [
      ...prev,
      {
        id,
        source: "custom",
        label: "New field",
        dataType: "text",
        defaultValue: "",
        enabled: true,
      },
    ]);
  };

  const handleSave = async () => {
    const orgId = organization?._id;
    if (!orgId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateExportConfig({
        organizationId: orgId,
        columns,
      });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackfillBankDefaults = async () => {
    const orgId = organization?._id;
    if (!orgId) return;
    setBackfilling(true);
    setBackfillResult(null);
    setBackfillError(null);
    try {
      const result = await backfillBankDefaults({ organizationId: orgId });
      setBackfillResult(result);
    } catch (e) {
      setBackfillResult(null);
      setBackfillError(e instanceof Error ? e.message : String(e));
    } finally {
      setBackfilling(false);
    }
  };

  if (userLoading || organization === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!exportingEnabled) {
    return (
      <div className="p-4 space-y-4">
        <Link to="/settings/modules">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Modules
          </Button>
        </Link>
        <p className="text-muted-foreground">The Export to Excel module is not enabled for your organization.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-destructive">Only organization admins can manage export configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link to="/settings/modules" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Export configuration</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Configure columns for the Employee List Excel export. Rename database columns, add custom
        columns with default values, reorder by dragging, and toggle columns on or off.
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Columns (drag to reorder)</h2>
          <Button type="button" variant="outline" size="sm" onClick={handleAddCustom}>
            <Plus className="h-4 w-4 mr-1" />
            Add custom field
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {columns.map((col) => (
                <SortableColumnRow
                  key={col.id}
                  column={col}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {saveError && (
        <p className="text-sm text-destructive">{saveError}</p>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Save configuration"
          )}
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h2 className="text-sm font-semibold">Bank details defaults</h2>
        <p className="text-sm text-muted-foreground">
          Set Pay Method to Electronic Payment, Account Type to Savings, and Relationship to Own for all employees
          who currently have these fields empty. Existing values are left unchanged.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleBackfillBankDefaults}
          disabled={backfilling || !organization?._id}
        >
          {backfilling ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Updating…
            </>
          ) : (
            "Set default bank fields for all employees"
          )}
        </Button>
        {backfillError && (
          <p className="text-sm text-destructive">
            {backfillError}
          </p>
        )}
        {backfillResult !== null && !backfillError && (
          <p className="text-sm text-muted-foreground">
            Updated {backfillResult.updated} of {backfillResult.total} employees.
          </p>
        )}
      </div>
    </div>
  );
}

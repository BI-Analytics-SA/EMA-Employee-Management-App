import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
];

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
      <div className="min-w-[140px] flex-1">
        <Input
          value={column.label}
          onChange={(e) => onUpdate(column.id, { label: e.target.value })}
          placeholder="Column label"
          className="h-8 text-sm"
        />
      </div>
      <span
        className={cn(
          "rounded px-2 py-0.5 text-xs font-medium",
          column.source === "database"
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
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
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
          <div className="min-w-[120px]">
            <Input
              value={column.defaultValue ?? ""}
              onChange={(e) => onUpdate(column.id, { defaultValue: e.target.value })}
              placeholder="Default value"
              className="h-8 text-sm"
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
  const { isAdmin, isLoading: userLoading } = useCurrentUser();
  const organization = useQuery(api.organizations.queries.getCurrentUserOrganization, undefined);
  const updateExportConfig = useMutation(api.organizations.mutations.updateExportConfig);

  const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_DATABASE_COLUMNS);
  const [saving, setSaving] = useState(false);

  const savedColumns = organization?.settings?.exportConfig?.columns;

  useEffect(() => {
    if (savedColumns && savedColumns.length > 0) {
      setColumns(savedColumns as ExportColumn[]);
    }
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
    try {
      await updateExportConfig({
        organizationId: orgId,
        columns,
      });
    } finally {
      setSaving(false);
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
        <p className="text-destructive">Only organization admins can manage export configuration.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
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
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, GripVertical, Plus, Trash2, FileDown, FileUp } from "lucide-react";
import { extractConvexError } from "@/lib/convex-error";
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

import {
  DEFAULT_DATABASE_COLUMNS,
  mergeExportColumns,
  type ExportColumn,
} from "./utils/exportConfig";
import { parseExportConfig, serializeExportConfig } from "./utils/exportConfigFile";

function SortableColumnRow({
  column,
  onUpdate,
  onRemove,
  isNew,
  onNewHandled,
}: {
  column: ExportColumn;
  onUpdate: (id: string, updates: Partial<ExportColumn>) => void;
  onRemove: (id: string) => void;
  isNew?: boolean;
  onNewHandled?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const rowRef = useRef<HTMLDivElement | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [highlight, setHighlight] = useState(false);

  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      rowRef.current = node;
    },
    [setNodeRef]
  );

  useEffect(() => {
    if (!isNew) {
      setHighlight(false);
      return;
    }
    setHighlight(true);
    requestAnimationFrame(() => {
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      labelInputRef.current?.focus();
      labelInputRef.current?.select();
    });
    const timer = setTimeout(() => {
      setHighlight(false);
      onNewHandled?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isNew, onNewHandled]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 transition-shadow duration-700",
        isDragging && "opacity-50 shadow-md",
        highlight && "ring-2 ring-primary"
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
          ref={labelInputRef}
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

  const newlyAddedIdRef = useRef<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_DATABASE_COLUMNS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedColumns = organization?.settings?.exportConfig?.columns as
    | ExportColumn[]
    | undefined;

  useEffect(() => {
    setColumns(mergeExportColumns(DEFAULT_DATABASE_COLUMNS, savedColumns));
  }, [savedColumns]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current != null) clearTimeout(successTimeoutRef.current);
    };
  }, []);

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
    const id = `custom-${crypto.randomUUID()}`;
    newlyAddedIdRef.current = id;
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

  const handleNewHandled = useCallback(() => {
    newlyAddedIdRef.current = null;
  }, []);

  const handleExportConfig = () => {
    setFileError(null);
    try {
      const blob = new Blob([serializeExportConfig(columns)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "employee-export-configuration.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setFileError("Could not export configuration. Please try again.");
    }
  };

  const handleImportConfig = async (file: File) => {
    setFileError(null);
    setImporting(true);
    try {
      if (file.size > 1024 * 1024) throw new Error("Configuration files must be smaller than 1 MB.");
      const imported = parseExportConfig(await file.text());
      setColumns(imported);
      newlyAddedIdRef.current = null;
      setSaveError(null);
      setSaveSuccess(false);
      const customCount = imported.filter((column) => column.source === "custom").length;
      setImportNotice(`Loaded ${imported.length} columns, including ${customCount} custom ${customCount === 1 ? "field" : "fields"}. This replaces the current configuration, including its custom fields, when you click Save configuration.`);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Could not read the configuration file.");
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    const orgId = organization?._id;
    if (!orgId) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateExportConfig({
        organizationId: orgId,
        columns,
      });
      setSaveSuccess(true);
      setImportNotice(null);
      if (successTimeoutRef.current != null) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSaveSuccess(false);
        successTimeoutRef.current = null;
      }, 3000);
    } catch (e) {
      setSaveError(extractConvexError(e, "Failed to save configuration."));
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

      <section className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-muted/70 px-3 py-2 border-b">
          <h2 className="text-sm font-semibold">Export / import configuration</h2>
        </div>
        <div className="p-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Export the current editor configuration, including unsaved changes, custom fields,
            default values, column order and disabled columns.
          </p>
          <p className="text-sm">
            <strong>Import replaces the entire current configuration, including existing custom fields.</strong>{" "}
            Custom fields from the file are included. Review the imported columns, then click
            Save configuration to apply the replacement.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleExportConfig} disabled={saving || importing} className="w-full sm:w-auto">
              <FileDown className="h-4 w-4" />
              Export configuration
            </Button>
            <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} disabled={saving || importing} className="w-full sm:w-auto">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Import configuration
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              aria-label="Import configuration file"
              className="hidden"
              disabled={saving || importing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleImportConfig(file);
              }}
            />
          </div>
          {fileError && <p role="alert" className="text-sm text-destructive">{fileError}</p>}
          {importNotice && <p role="status" aria-label="Imported configuration" className="text-sm text-muted-foreground">{importNotice}</p>}
        </div>
      </section>

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
                  isNew={col.id === newlyAddedIdRef.current}
                  onNewHandled={handleNewHandled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {saveError && (
        <p className="text-sm text-destructive">{saveError}</p>
      )}
      {saveSuccess && (
        <p className="text-sm text-success">Configuration saved.</p>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving || importing}>
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

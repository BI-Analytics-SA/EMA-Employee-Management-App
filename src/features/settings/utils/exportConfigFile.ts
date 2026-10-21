import { z } from "zod";
import { DEFAULT_DATABASE_COLUMNS, mergeExportColumns, type ExportColumn } from "./exportConfig";

const format = "ema-export-configuration";
const databaseFields = new Set(DEFAULT_DATABASE_COLUMNS.map((column) => column.dbField));
const databaseIds = new Set(DEFAULT_DATABASE_COLUMNS.map((column) => column.id));

const columnSchema = z.object({
  id: z.string().trim().min(1),
  source: z.enum(["database", "custom"]),
  dbField: z.string().optional(),
  label: z.string(),
  dataType: z.enum(["text", "number", "date"]),
  defaultValue: z.string().optional(),
  enabled: z.boolean(),
}).strict().superRefine((column, ctx) => {
  if (column.source === "database" &&
      (!databaseFields.has(column.dbField) || column.id !== column.dbField)) {
    ctx.addIssue({ code: "custom", message: "Unknown or mismatched database column." });
  }
  if (column.source === "custom" && (column.dbField !== undefined || databaseIds.has(column.id))) {
    ctx.addIssue({ code: "custom", message: "Custom columns must have their own ID and no database field." });
  }
});

const configSchema = z.object({
  format: z.literal(format),
  version: z.literal(1),
  columns: z.array(columnSchema).min(1),
}).strict().superRefine(({ columns }, ctx) => {
  if (new Set(columns.map((column) => column.id)).size !== columns.length) {
    ctx.addIssue({ code: "custom", message: "Column IDs must be unique." });
  }
});

/** Includes disabled and custom columns, their defaults, and the current editor order. */
export function serializeExportConfig(columns: ExportColumn[]): string {
  return JSON.stringify({ format, version: 1, columns }, null, 2);
}

/** Validate the whole file before replacing anything in the editor. */
export function parseExportConfig(text: string): ExportColumn[] {
  let json: unknown;
  try {
    json = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Invalid JSON. Select a configuration JSON file exported by this app.");
  }
  const result = configSchema.safeParse(json);
  if (!result.success) {
    throw new Error("Invalid or unsupported export configuration. " + result.error.issues[0].message);
  }

  // Make any database columns absent from the file available but disabled.
  // No existing organization's columns or custom defaults are merged into the import.
  return mergeExportColumns(
    DEFAULT_DATABASE_COLUMNS.map((column) => ({ ...column, enabled: false })),
    result.data.columns
  );
}

import { describe, expect, it } from "vitest";
import { DEFAULT_DATABASE_COLUMNS, type ExportColumn } from "./exportConfig";
import { parseExportConfig, serializeExportConfig } from "./exportConfigFile";

const customColumns: ExportColumn[] = [
  { id: "custom-payroll", source: "custom", label: "Payroll code", dataType: "text", defaultValue: "00123", enabled: true },
  { id: "custom-rate", source: "custom", label: "Rate", dataType: "number", defaultValue: "125.50", enabled: false },
  { id: "custom-date", source: "custom", label: "Run date", dataType: "date", defaultValue: "2026-10-21", enabled: true },
];

describe("export configuration files", () => {
  it("round-trips all columns in order, including disabled custom fields, types and defaults", () => {
    const columns = [customColumns[1], { ...DEFAULT_DATABASE_COLUMNS[1], label: "SA ID", enabled: false }, ...customColumns.filter((_, i) => i !== 1), ...DEFAULT_DATABASE_COLUMNS.filter((_, i) => i !== 1)];
    expect(parseExportConfig(serializeExportConfig(columns))).toEqual(columns);
  });

  it("preserves blank and Unicode labels and values", () => {
    const columns = [{ ...customColumns[0], label: "", defaultValue: 'Café "Payroll"\nSecond line' }];
    expect(parseExportConfig(serializeExportConfig(columns))[0]).toEqual(columns[0]);
  });

  it("keeps database columns absent from the file disabled", () => {
    const imported = parseExportConfig(serializeExportConfig(customColumns));
    expect(imported.slice(0, customColumns.length)).toEqual(customColumns);
    expect(imported.filter((column) => column.source === "database").every((column) => !column.enabled)).toBe(true);
  });

  it("accepts a UTF-8 BOM", () => {
    expect(parseExportConfig("\uFEFF" + serializeExportConfig(customColumns))[0]).toEqual(customColumns[0]);
  });

  it("imports saved Work Address Code columns alongside custom fields", () => {
    const workAddressColumn: ExportColumn = { id: "workAddressCode", source: "database", dbField: "workAddressCode", label: "Work Address", dataType: "number", enabled: true };
    const imported = parseExportConfig(serializeExportConfig([workAddressColumn, ...customColumns]));
    expect(imported.slice(0, 4)).toEqual([workAddressColumn, ...customColumns]);
  });

  it.each([
    "{broken", "null", "[]", '{}',
    JSON.stringify({ format: "other-app", version: 1, columns: customColumns }),
    JSON.stringify({ format: "ema-export-configuration", version: 99, columns: customColumns }),
    serializeExportConfig([]),
    serializeExportConfig([customColumns[0], customColumns[0]]),
    serializeExportConfig([{ ...customColumns[0], dataType: "unsupported" } as unknown as ExportColumn]),
    serializeExportConfig([{ ...customColumns[0], enabled: "yes" } as unknown as ExportColumn]),
    serializeExportConfig([{ ...customColumns[0], source: "database", dbField: "password" }]),
    serializeExportConfig([{ ...DEFAULT_DATABASE_COLUMNS[0], dbField: "idNumber" }]),
    serializeExportConfig([{ ...customColumns[0], id: "idNumber" }]),
    serializeExportConfig([{ ...customColumns[0], dbField: "idNumber" }]),
  ])("rejects invalid or unsupported files: %s", (text) => {
    expect(() => parseExportConfig(text)).toThrow(/Invalid|unsupported/);
  });
});

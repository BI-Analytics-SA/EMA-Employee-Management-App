import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExportConfigPage } from "./ExportConfigPage";
import { DEFAULT_DATABASE_COLUMNS, type ExportColumn } from "./utils/exportConfig";
import { parseExportConfig, serializeExportConfig } from "./utils/exportConfigFile";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  isAdmin: true,
  enabled: true,
}));

const savedColumns: ExportColumn[] = [
  ...DEFAULT_DATABASE_COLUMNS,
  { id: "custom-old", source: "custom", label: "Old custom field", dataType: "text", defaultValue: "old default", enabled: true },
];
const organization = { _id: "org1", settings: { exportConfig: { columns: savedColumns } } };

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ organization, isAdmin: mocks.isAdmin, isLoading: false }),
}));
vi.mock("@/hooks/useModuleEnabled", () => ({ useModuleEnabled: () => mocks.enabled }));
vi.mock("convex/react", () => ({ useMutation: () => mocks.save }));

function renderPage() {
  render(<MemoryRouter><ExportConfigPage /></MemoryRouter>);
}

function upload(text: string) {
  const file = new File([text], "configuration.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: () => Promise.resolve(text) });
  fireEvent.change(screen.getByLabelText("Import configuration file"), { target: { files: [file] } });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin = true;
  mocks.enabled = true;
  mocks.save.mockResolvedValue({ success: true });
});

describe("ExportConfigPage import and export", () => {
  it("downloads the editor configuration with unsaved custom values and disabled fields", async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:configuration");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPage();
    fireEvent.change(screen.getByDisplayValue("old default"), { target: { value: "unsaved default" } });
    fireEvent.click(screen.getByRole("button", { name: "Export configuration" }));

    expect(click).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
    const columns = parseExportConfig(text);
    expect(columns.find((column) => column.id === "custom-old")?.defaultValue).toBe("unsaved default");
    expect(columns.find((column) => column.id === "email")?.enabled).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("warns that import replaces existing custom fields and requires Save", () => {
    renderPage();
    expect(screen.getByText("Import replaces the entire current configuration, including existing custom fields.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Export configuration" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Import configuration" })).toBeEnabled();
    expect(screen.getByText(/Review the imported columns/)).toBeVisible();
  });

  it("replaces existing custom fields, preserves imported defaults, and only persists on Save", async () => {
    renderPage();
    const imported: ExportColumn[] = [
      { id: "custom-new", source: "custom", label: "New payroll code", dataType: "text", defaultValue: "00123", enabled: false },
      { ...DEFAULT_DATABASE_COLUMNS[1], label: "Imported ID" },
    ];
    upload(serializeExportConfig(imported));
    await screen.findByDisplayValue("New payroll code");
    expect(screen.queryByDisplayValue("Old custom field")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("00123")).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(screen.getByRole("status", { name: "Imported configuration" })).toHaveTextContent("including 1 custom field");

    fireEvent.click(screen.getByRole("button", { name: "Save configuration" }));
    await screen.findByText("Configuration saved.");
    expect(mocks.save).toHaveBeenCalledWith({
      organizationId: "org1",
      columns: expect.arrayContaining(imported),
    });
    const columns = mocks.save.mock.calls[0][0].columns as ExportColumn[];
    expect(columns.slice(0, 2)).toEqual(imported);
    expect(columns.some((column) => column.id === "custom-old")).toBe(false);
    expect(columns.find((column) => column.id === "firstName")?.enabled).toBe(false);
  });

  it("leaves the editor untouched after an invalid file", async () => {
    renderPage();
    upload('{"columns":[{"label":"bad"}]}');
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid or unsupported export configuration");
    expect(screen.getByDisplayValue("Old custom field")).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("keeps imported fields available after a save failure", async () => {
    mocks.save.mockRejectedValueOnce(new Error("Save failed"));
    renderPage();
    upload(serializeExportConfig([{ id: "custom-new", source: "custom", label: "Retry column", dataType: "number", defaultValue: "10", enabled: true }]));
    await screen.findByDisplayValue("Retry column");
    fireEvent.click(screen.getByRole("button", { name: "Save configuration" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save configuration" })).toBeEnabled());
    expect(screen.getByDisplayValue("Retry column")).toBeInTheDocument();
    expect(screen.queryByText("Configuration saved.")).not.toBeInTheDocument();
  });

  it("hides configuration transfer from non-admins and when the module is disabled", () => {
    mocks.isAdmin = false;
    renderPage();
    expect(screen.queryByRole("button", { name: "Import configuration" })).not.toBeInTheDocument();
    cleanup();
    mocks.isAdmin = true;
    mocks.enabled = false;
    renderPage();
    expect(screen.queryByRole("button", { name: "Export configuration" })).not.toBeInTheDocument();
  });
});

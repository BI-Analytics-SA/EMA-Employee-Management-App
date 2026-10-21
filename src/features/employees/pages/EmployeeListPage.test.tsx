import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getFunctionName } from "convex/server";
import { EmployeeListPage } from "./EmployeeListPage";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
const employee = { _id: "emp1", idNumber: "9001015001087", firstName: "John", lastName: "Doe" };

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ organizationId: "org1", isLoading: false, isAdmin: false }),
}));
vi.mock("@/hooks/useModuleEnabled", () => ({ useModuleEnabled: () => false }));
vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mocks.query(...args),
  useMutation: () => vi.fn(),
  usePaginatedQuery: () => ({ results: [employee], status: "Exhausted", loadMore: vi.fn() }),
}));
vi.mock("@/features/employees/components/ExportButton", () => ({ ExportButton: () => null }));
vi.mock("@/features/employees/components/ClearColumnsDialog", () => ({ ClearColumnsDialog: () => null }));
vi.mock("@/components/shared/BarcodeScanner", () => ({
  BarcodeScanner: ({ open, onDetected }: { open: boolean; onDetected: (code: string) => void }) =>
    open ? <button onClick={() => onDetected("9001015001087")}>Simulate scan</button> : null,
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockImplementation((query, args) => {
    if (getFunctionName(query).endsWith(":count")) return 1;
    if (args === "skip") return undefined;
    return args.search === "missing" ? [] : [employee];
  });
});

function renderPage() {
  render(<MemoryRouter><EmployeeListPage /></MemoryRouter>);
}

describe("EmployeeListPage search", () => {
  it.each(["button", "enter"])("submits unrestricted field text using %s, without searching while typing", (method) => {
    renderPage();
    const input = screen.getByRole("textbox", { name: "Search all employee fields" });
    expect(input).not.toHaveAttribute("maxlength");
    fireEvent.change(input, { target: { value: "  Cape Town Logistics  " } });
    expect(mocks.query.mock.calls.some(([, args]) => typeof args === "object" && args?.search)).toBe(false);
    if (method === "button") fireEvent.click(screen.getByRole("button", { name: "Search" }));
    else fireEvent.keyDown(input, { key: "Enter" });
    expect(mocks.query).toHaveBeenCalledWith(expect.anything(), { organizationId: "org1", search: "Cape Town Logistics" });

    fireEvent.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(input).toHaveValue("");
    expect(screen.getByText("John Doe")).toBeVisible();
  });

  it("uses general empty-state text for unmatched searches", () => {
    renderPage();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "missing" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByText("No employees match your search.")).toBeVisible();
  });

  it("still searches after barcode scanning", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Scan" }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate scan" }));
    expect(mocks.query).toHaveBeenCalledWith(expect.anything(), { organizationId: "org1", search: employee.idNumber });
    expect(screen.getByRole("textbox")).toHaveValue(employee.idNumber);
  });
});

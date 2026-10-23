import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import * as XLSX from "xlsx";
import { ExportButton } from "@/features/employees/components/ExportButton";
import { EmployeeReportPage } from "@/features/reports/pages/EmployeeReportPage";
import { PlatformBillingSection } from "@/features/platform/components/PlatformBillingSection";
import { ContractPdfTemplate } from "@/features/contracts/components/ContractPdfTemplate";
import { DEFAULT_DATABASE_COLUMNS } from "@/features/settings/utils/exportConfig";
import { timestampToDateString } from "@/lib/validations/contract";

vi.mock("xlsx", async (importOriginal) => ({
  ...await importOriginal<typeof XLSX>(),
  writeFile: vi.fn(),
}));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: vi.fn() }));
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useConvex: vi.fn(),
}));

const { useCurrentUser } = await import("@/hooks/useCurrentUser");
const { useQuery, useConvex } = await import("convex/react");
const dateFields = [
  "dateOfBirth", "dateEngaged", "dateRegistered", "lastDateWorked",
  "uifEndDate", "taxYearStart", "newUifStartDate",
];
// Local noon gives a fixed calendar day in every timezone in the test matrix.
const timestamp = new Date(2026, 2, 18, 12).getTime();
const employee = {
  _id: "emp1", firstName: "John", lastName: "Doe",
  ...Object.fromEntries(dateFields.map((field) => [field, timestamp])),
};

function exportedSheet(name: string) {
  const calls = vi.mocked(XLSX.writeFile).mock.calls;
  const workbook = calls[calls.length - 1][0] as XLSX.WorkBook;
  return XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[name]);
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCurrentUser).mockReturnValue({
    organizationId: "org1", organization: { settings: {} }, isLoading: false,
  } as ReturnType<typeof useCurrentUser>);
});

describe("date output characterization (PEPL-65 must preserve these outputs)", () => {
  it("keeps employee Excel dates and custom date defaults exactly as before", async () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      organizationId: "org1", isLoading: false,
      organization: { settings: { exportConfig: { columns: [
        ...DEFAULT_DATABASE_COLUMNS.map((col) => ({ ...col, enabled: col.dataType === "date" })),
        { id: "custom-date", source: "custom", label: "Run date", dataType: "date", defaultValue: "2026-03-18", enabled: true },
      ] } } },
    } as ReturnType<typeof useCurrentUser>);
    vi.mocked(useQuery).mockReturnValue([employee]);
    vi.mocked(useConvex).mockReturnValue({ query: vi.fn().mockResolvedValue([employee]) } as unknown as ReturnType<typeof useConvex>);
    render(<ExportButton />);
    fireEvent.click(screen.getByRole("button", { name: "Export to Excel" }));
    await waitFor(() => expect(XLSX.writeFile).toHaveBeenCalled());
    const row = exportedSheet("Employees")[0];
    for (const col of DEFAULT_DATABASE_COLUMNS.filter((col) => col.dataType === "date")) {
      expect(row[col.label]).toBe(dateFields.includes(col.dbField ?? "") ? "2026/03/18" : "");
    }
    expect(row["Run date"]).toBe("2026-03-18");
  });

  it("keeps all seven Employee Report Excel date columns in the existing locale format", () => {
    vi.mocked(useQuery).mockImplementation((_query, args?: unknown) =>
      args && typeof args === "object" && "reportId" in args ? dateFields : [employee]
    );
    render(<MemoryRouter><EmployeeReportPage /></MemoryRouter>);
    expect(screen.getAllByText("2026/03/18")).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: "Export to Excel" }));
    expect(Object.values(exportedSheet("Employee Report")[0])).toEqual(
      Array(7).fill(new Date(timestamp).toLocaleDateString())
    );
  });

  it("keeps paid and trial billing Excel dates in the existing en-ZA short-month format", () => {
    const row = {
      id: "org1", name: "Example", slug: "example", planStatus: "active",
      signedUpAt: timestamp, payingSince: timestamp, lastActiveAt: timestamp,
      daysAsPayingCustomer: 1, modules: {}, moduleCount: 0, discountZar: 0,
      monthlyInvoiceZar: 0, memberCount: 1, employeeCount: 1, activeMembers30d: 1,
    };
    vi.mocked(useQuery).mockReturnValue({
      snapshot: { orgsWithPlanHistory: 1, totalOrgs: 1, totalMonthlyRevenueZar: 0 },
      trend: [], invoicingRows: [row], trialUsageRows: [row], expiredTrialOrgs: [],
    });
    render(<PlatformBillingSection />);
    expect(screen.getAllByText("2026/03/18")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Export Excel" }));
    const paid = exportedSheet("Invoicing (paid)")[0];
    const trial = exportedSheet("Trial usage")[0];
    expect([paid["Signed up"], paid["Paying since"], paid["Last active"], trial["Signed up"], trial["Last active"]])
      .toEqual(Array(5).fill("18 Mar 2026"));
  });

  it("keeps generated contract date, acceptance, start and engagement dates in long-month format", () => {
    const html = renderToStaticMarkup(<ContractPdfTemplate
      companyName="Example" contractHeading="Contract" contractCategory="Permanent"
      placeOfSignature="Cape Town" employeeName="John Doe" idNumber="123" employeeNo="E1"
      signedDate={String(timestamp)} startDate={String(timestamp)} dateEngaged={String(timestamp)}
      termsAndConditionsHtml="<p>Terms</p>"
    />);
    expect(html).toContain("Date: 18 March 2026");
    expect(html).toContain("on this 18 March 2026");
    expect(html).toContain("Start date: 18 March 2026");
    expect(html).toContain("Date engaged: 18 March 2026");
  });

  it("keeps contract input dates in UTC and empty values unchanged", () => {
    expect(timestampToDateString(Date.parse("2026-03-18T23:59:59Z"))).toBe("2026-03-18");
    expect(timestampToDateString(Date.parse("2026-03-19T00:00:01Z"))).toBe("2026-03-19");
    expect(timestampToDateString(undefined)).toBe("");
    expect(timestampToDateString(0)).toBe("");
  });
});

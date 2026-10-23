import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getFunctionName } from "convex/server";
import { EmployeeDetailPage } from "@/features/employees/pages/EmployeeDetailPage";
import { ContractListPage } from "@/features/employees/pages/ContractListPage";
import { ContractDetailPage } from "@/features/employees/pages/ContractDetailPage";
import { JobListPage } from "@/features/jobs/pages/JobListPage";
import { JobDetailPage } from "@/features/jobs/pages/JobDetailPage";
import { TeamPage } from "@/features/settings/TeamPage";
import { ExpiryBadge } from "@/components/shared/ExpiryBadge";
import { PlatformTrendChart } from "@/features/platform/components/PlatformTrendChart";

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ organizationId: "org1", organization: { settings: {} }, isAdmin: true, isLoading: false }),
  useHasRole: () => false,
}));
vi.mock("@/hooks/useModuleEnabled", () => ({ useModuleEnabled: () => true }));
// These tests exercise list/detail UI, not document editing or PDF generation.
vi.mock("@/features/contracts/components/ContractForm", () => ({ ContractForm: () => null }));
vi.mock("convex/react", () => ({
  useQuery: vi.fn(), useMutation: () => vi.fn(), useAction: () => vi.fn(),
}));

const { useQuery } = await import("convex/react");
let queryResults: Record<string, unknown>;
const localDate = new Date(2026, 2, 18, 0).getTime();
const employee = { _id: "emp1", firstName: "John", lastName: "Doe", knownAs: "John", idNumber: "123" };
const job = { _id: "job1", title: "Job", status: "open", startDate: localDate, endDate: localDate, createdAt: localDate };

function renderRoute(Page: () => React.ReactNode, path: string, url: string) {
  return render(<MemoryRouter initialEntries={[url]}><Routes><Route path={path} element={<Page />} /></Routes></MemoryRouter>);
}

afterEach(cleanup);
beforeEach(() => {
  queryResults = {};
  vi.mocked(useQuery).mockImplementation((query, args?: unknown) => args === "skip" ? undefined : queryResults[getFunctionName(query)] ?? []);
});

it("shows all seven employee date fields on their original local calendar day", () => {
  queryResults["employees/queries:getById"] = {
    ...employee, ...Object.fromEntries([
      "dateOfBirth", "dateRegistered", "dateEngaged", "lastDateWorked",
      "uifEndDate", "taxYearStart", "newUifStartDate",
    ].map((field) => [field, localDate])),
  };
  renderRoute(EmployeeDetailPage, "/employees/:id", "/employees/emp1");
  expect(screen.getAllByText("2026/03/18")).toHaveLength(7);
});

it("keeps missing/zero employee dates hidden and the birth date placeholder", () => {
  queryResults["employees/queries:getById"] = { ...employee, dateOfBirth: 0, dateRegistered: 0 };
  renderRoute(EmployeeDetailPage, "/employees/:id", "/employees/emp1");
  expect(screen.getByText("Date of birth:").parentElement).toHaveTextContent("—");
  expect(screen.queryByText("Date registered:")).not.toBeInTheDocument();
  expect(screen.queryByText("Date engaged:")).not.toBeInTheDocument();
});

it("shows both Jobs list dates in yyyy/mm/dd", () => {
  queryResults["jobs/queries:listByOrganization"] = [job];
  renderRoute(JobListPage, "/jobs", "/jobs");
  expect(screen.getByText("2026/03/18 – 2026/03/18")).toBeInTheDocument();
});

it("shows start, end and created dates on the Job detail page", () => {
  queryResults["jobs/queries:getById"] = job;
  renderRoute(JobDetailPage, "/jobs/:id", "/jobs/job1");
  expect(screen.getAllByText("2026/03/18")).toHaveLength(3);
});

it("preserves UTC days in the contract list even when local time crosses midnight", () => {
  queryResults["employees/queries:getById"] = employee;
  queryResults["contracts/queries:listByEmployee"] = [{
    _id: "contract1", signedDate: Date.parse("2026-03-18T23:59:59Z"), startDate: Date.parse("2026-03-19T00:00:01Z"),
  }];
  renderRoute(ContractListPage, "/employees/:id/contracts", "/employees/emp1/contracts");
  expect(screen.getByText("Signed 2026/03/18")).toBeInTheDocument();
  expect(screen.getByText("Start: 2026/03/19")).toBeInTheDocument();
});

it("preserves UTC days in the contract detail heading", () => {
  queryResults["employees/queries:getById"] = employee;
  queryResults["contracts/queries:getById"] = { signedDate: Date.parse("2026-03-18T23:59:59Z") };
  renderRoute(ContractDetailPage, "/employees/:id/contracts/:contractId", "/employees/emp1/contracts/contract1");
  expect(screen.getByRole("heading", { name: "Contract · John Doe · 2026/03/18" })).toBeInTheDocument();
});

it("shows Team Last session with the new format and preserves Never", () => {
  queryResults["userProfiles/queries:listByOrganization"] = [
    { _id: "user1", name: "John", role: "user", isActive: true, lastLoginAt: localDate },
    { _id: "user2", name: "Jane", role: "user", isActive: true },
  ];
  render(<TeamPage />);
  expect(screen.getByText("Last session: 2026/03/18")).toBeInTheDocument();
  expect(screen.getByText("Last session: Never")).toBeInTheDocument();
});

it("formats expiry badge text and tooltip while retaining status labels", () => {
  const { rerender } = render(<ExpiryBadge expiryDate={localDate} showLabel={false} />);
  expect(screen.getByTitle("Expires: 2026/03/18")).toHaveTextContent("2026/03/18");
  rerender(<ExpiryBadge expiryDate={1} />);
  expect(screen.getByText("Expired")).toBeInTheDocument();
});

it("shows SAST day/month bucket dates in platform chart labels without changing chart data", () => {
  const point = {
    label: "Sept 2026", startMs: Date.parse("2026-08-31T22:00:00Z"),
    trialOrgsAtPeriodEnd: 1, paidOrgsAtPeriodEnd: 1, signups: 1, paidActivations: 1,
  };
  render(<PlatformTrendChart data={[point]} />);
  expect(screen.getByText("2026/09/01")).toBeInTheDocument();
  expect(point.label).toBe("Sept 2026");
  expect(point.startMs).toBe(Date.parse("2026-08-31T22:00:00Z"));
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EmployeeReportPage } from "./EmployeeReportPage";

const mockEmployees = [
  {
    _id: "emp1" as const,
    organizationId: "org1" as const,
    idNumber: "9001015001087",
    employeeNo: "E001",
    title: "MR" as const,
    initials: "JD",
    firstName: "John",
    lastName: "Doe",
    knownAs: "John",
    dateOfBirth: 0,
    gender: "M" as const,
    ethnicGroup: "W" as const,
    cellNumber: "0821111111",
    resStreetNo: "1",
    resStreetName: "Main",
    resSuburb: "Suburb",
    resCity: "City",
    resPostCode: "1000",
    dateRegistered: undefined,
    dateEngaged: undefined,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    _id: "emp2" as const,
    organizationId: "org1" as const,
    idNumber: "9002025002087",
    employeeNo: "E002",
    title: "MRS" as const,
    initials: "JD",
    firstName: "Jane",
    lastName: "Doe",
    knownAs: "Jane",
    dateOfBirth: 0,
    gender: "F" as const,
    ethnicGroup: "W" as const,
    cellNumber: "0822222222",
    resStreetNo: "2",
    resStreetName: "Oak",
    resSuburb: "Town",
    resCity: "City",
    resPostCode: "2000",
    dateRegistered: undefined,
    dateEngaged: undefined,
    createdAt: 0,
    updatedAt: 0,
  },
];

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

const useCurrentUser = vi.mocked(
  await import("@/hooks/useCurrentUser").then((m) => m.useCurrentUser)
);
const useQuery = vi.mocked(await import("convex/react").then((m) => m.useQuery));

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeeReportPage />
    </MemoryRouter>
  );
}

describe("EmployeeReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCurrentUser.mockReturnValue({
      organizationId: "org1",
      isLoading: false,
      isAdmin: false,
      profile: null,
    } as ReturnType<typeof useCurrentUser>);
    useQuery.mockImplementation((queryRef: unknown, args: unknown) => {
      if (args && typeof args === "object" && "organizationId" in args) {
        return mockEmployees;
      }
      if (args && typeof args === "object" && "reportId" in args) {
        return null;
      }
      return undefined;
    });
  });

  it("shows Employee Report heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /employee report/i })).toBeInTheDocument();
  });

  it("shows Columns button for column picker", () => {
    renderPage();
    const buttons = screen.getAllByTitle("Choose columns");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    expect(buttons[0]).toBeInTheDocument();
  });

  it("renders table with default columns (Name, ID Number, Employee #)", () => {
    renderPage();
    const tables = screen.getAllByRole("table");
    const table = tables[0];
    expect(within(table).getByText("Name")).toBeInTheDocument();
    expect(within(table).getByText("ID Number")).toBeInTheDocument();
    expect(within(table).getByText("Employee #")).toBeInTheDocument();
  });

  it("renders one Edit link per employee with correct href to edit page", () => {
    renderPage();
    const tables = screen.getAllByRole("table");
    const table = tables[0];
    const editLinks = within(table).getAllByRole("link", { name: /edit/i });
    expect(editLinks).toHaveLength(mockEmployees.length);
    expect(editLinks[0].getAttribute("href")).toMatch(/^\/employees\/emp1\/edit(\?|$)/);
    expect(editLinks[0].getAttribute("href")).toContain("returnTo=%2Freports%2Femployees");
    expect(editLinks[1].getAttribute("href")).toMatch(/^\/employees\/emp2\/edit(\?|$)/);
  });

  it("shows employee data in table cells", () => {
    renderPage();
    const tables = screen.getAllByRole("table");
    const table = tables[0];
    expect(within(table).getByText("Mr John Doe")).toBeInTheDocument();
    expect(within(table).getByText("Mrs Jane Doe")).toBeInTheDocument();
    expect(within(table).getByText("9001015001087")).toBeInTheDocument();
    expect(within(table).getByText("E001")).toBeInTheDocument();
  });
});

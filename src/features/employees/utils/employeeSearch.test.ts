import { describe, expect, it, vi } from "vitest";
import { matchesEmployeeSearch } from "../../../../convex/employees/search";
import { startOfSastDayFromDateStr } from "../../../../convex/lib/calendarDates";

describe("employee field search", () => {
  it.each([
    ["idNumber", "9001015001087"], ["employeeNo", "EMP-001"],
    ["title", "PROF"], ["initials", "JD"], ["firstName", "John"],
    ["secondName", "James"], ["lastName", "Doe"], ["knownAs", "Johnny"],
    ["gender", "M"], ["ethnicGroup", "A"], ["language", "English"],
    ["cellNumber", "0821234567"], ["alternativeNumber", "0219876543"],
    ["email", "john@example.com"], ["resUnit", "12B"], ["resComplex", "Oak Estate"],
    ["resStreetNo", "123"], ["resStreetName", "Main Road"], ["resSuburb", "Claremont"],
    ["resCity", "Cape Town"], ["resPostCode", "7708"], ["residentialCountry", "South Africa"],
    ["taxNumber", "9876543210"], ["certificate", "First Aid"], ["hrsPerPeriod", 180],
    ["hoursPerDay", 7.5], ["workAddressCode", 123], ["companyNumber", "COMP-001"],
    ["shift", "Night"], ["shiftAllocation", "Team Alpha"], ["deptGroup", "Operations"],
    ["departmentWorked", "Warehouse"], ["department", "Logistics"], ["maritalStatus", "MARRIED"],
    ["illnessCondition", "Asthma"], ["payMethod", "03"], ["bankAccType", "S"],
    ["bankAccNo", "1234567890"], ["bankName", "Zero Bank"], ["branchCode", "888000"],
    ["accHolder", "John Doe"], ["accRelationship", "O"], ["repAddr1", "Unit 1"],
    ["repAddr2", "Oak Road"], ["repAddr3", "Cape Town"], ["repPostCode", "7708"],
    ["fullNames", "John James Doe"],
  ])("searches %s", (field, value) => {
    expect(matchesEmployeeSearch({ [field]: value }, String(value).toUpperCase())).toBe(true);
  });

  it.each([
    "dateOfBirth", "dateRegistered", "dateEngaged", "lastDateWorked",
    "uifEndDate", "taxYearStart", "newUifStartDate",
  ])("searches %s using the South African calendar day", (field) => {
    const employee = { [field]: startOfSastDayFromDateStr("2026-10-21") };
    for (const query of ["2026-10-21", "21/10/2026", "21-10-2026", "2026"]) {
      expect(matchesEmployeeSearch(employee, query)).toBe(true);
    }
    expect(matchesEmployeeSearch(employee, "2026-10-20")).toBe(false);
  });

  it("supports partial matches and multiple words across fields", () => {
    const employee = { firstName: "John", lastName: "Doe", department: "Logistics" };
    expect(matchesEmployeeSearch(employee, "  jo  DOE  log ")).toBe(true);
    expect(matchesEmployeeSearch(employee, "John finance")).toBe(false);
  });

  it("searches friendly labels and boolean values", () => {
    expect(matchesEmployeeSearch({ payMethod: "03" }, "electronic payment")).toBe(true);
    expect(matchesEmployeeSearch({ bankAccType: "S" }, "savings")).toBe(true);
    expect(matchesEmployeeSearch({ gender: "F" }, "female")).toBe(true);
    expect(matchesEmployeeSearch({ ethnicGroup: "A" }, "african")).toBe(true);
    expect(matchesEmployeeSearch({ accRelationship: "T" }, "3rd party")).toBe(true);
    expect(matchesEmployeeSearch({ training: true }, "yes")).toBe(true);
    expect(matchesEmployeeSearch({ training: false }, "false")).toBe(true);
    expect(matchesEmployeeSearch({ hoursPerDay: 0 }, "0")).toBe(true);
  });

  it("ignores missing values, internal metadata, and empty searches", () => {
    expect(matchesEmployeeSearch({ email: undefined, firstName: null }, "undefined")).toBe(false);
    expect(matchesEmployeeSearch({ organizationId: "org-secret", imageUrl: "secret.jpg" }, "secret")).toBe(false);
    expect(matchesEmployeeSearch({ firstName: "John" }, "  ")).toBe(false);
  });
});

vi.mock("../../../../convex/_generated/server", () => ({ query: (config: unknown) => config }));
vi.mock("../../../../convex/lib/permissions", () => ({ requireOrganizationAccess: vi.fn() }));

describe("organization employee search query", () => {
  it("checks access and queries the organization index without limiting matches to 20", async () => {
    const { search } = await import("../../../../convex/employees/queries");
    const { requireOrganizationAccess } = await import("../../../../convex/lib/permissions");
    const employees = Array.from({ length: 25 }, (_, i) => ({ idNumber: String(i), department: "Logistics" }));
    const eq = vi.fn();
    const collect = vi.fn().mockResolvedValue(employees);
    const withIndex = vi.fn((_index, callback) => {
      callback({ eq });
      return { order: () => ({ collect }) };
    });
    const ctx = { db: { query: vi.fn(() => ({ withIndex })) } };
    const handler = (search as unknown as { handler: (ctx: unknown, args: unknown) => Promise<unknown[]> }).handler;

    expect(await handler(ctx, { organizationId: "org1", search: "log" })).toHaveLength(25);
    expect(requireOrganizationAccess).toHaveBeenCalledWith(ctx, "org1");
    expect(withIndex).toHaveBeenCalledWith("by_organization_createdAt", expect.any(Function));
    expect(eq).toHaveBeenCalledWith("organizationId", "org1");

    vi.mocked(requireOrganizationAccess).mockRejectedValueOnce(new Error("Access denied"));
    ctx.db.query.mockClear();
    await expect(handler(ctx, { organizationId: "other-org", search: "log" })).rejects.toThrow("Access denied");
    expect(ctx.db.query).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getById as getEmployee } from "../../convex/employees/queries";
import { getById as getContract, listByEmployee as listContracts } from "../../convex/contracts/queries";
import { getById as getJob } from "../../convex/jobs/queries";
import { getById as getDocument, listByEmployee as listDocuments } from "../../convex/documents/queries";
import { getById as getJobDocument, listByJob as listJobDocuments } from "../../convex/jobDocuments/queries";
import { requireOrganizationAccess, requireModuleEnabled } from "../../convex/lib/permissions";

vi.mock("../../convex/_generated/server", () => ({
  query: (config: unknown) => config,
  internalQuery: (config: unknown) => config,
}));
vi.mock("../../convex/lib/permissions", () => ({
  requireOrganizationAccess: vi.fn(),
  requireModuleEnabled: vi.fn(),
}));

const normalizeId = vi.fn();
const get = vi.fn();
const collect = vi.fn();
const eq = vi.fn();
const withIndex = vi.fn();
const query = vi.fn();
const ctx = { db: { normalizeId, get, query } };
// Match the existing query-test pattern: expose handlers without a live Convex backend.
function invoke(query: unknown, args: Record<string, string>) {
  return (query as { handler: (ctx: unknown, args: unknown) => Promise<unknown> }).handler(ctx, args);
}

const record = { _id: "normalized-id", organizationId: "org1", createdAt: 1 };

beforeEach(() => {
  vi.resetAllMocks();
  normalizeId.mockReturnValue("normalized-id");
  get.mockResolvedValue(record);
  collect.mockResolvedValue([record]);
  eq.mockReturnValue({});
  withIndex.mockImplementation((_index, callback) => {
    callback({ eq });
    return { order: () => ({ collect }), collect };
  });
  query.mockReturnValue({ withIndex });
});

describe.each([
  { table: "employees", module: undefined, run: (id: string) => invoke(getEmployee, { id }) },
  { table: "contracts", module: "contracts", run: (id: string) => invoke(getContract, { id }) },
  { table: "jobs", module: "jobs", run: (id: string) => invoke(getJob, { id }) },
  { table: "employeeDocuments", module: undefined, run: (id: string) => invoke(getDocument, { id }) },
  { table: "jobDocuments", module: "jobs", run: (id: string) => invoke(getJobDocument, { id }) },
])("$table detail query", ({ table, module, run }) => {
  it("returns null for malformed or wrong-table IDs without reading the database", async () => {
    normalizeId.mockReturnValue(null);
    expect(await run("qa-bot-junk-id")).toBeNull();
    expect(normalizeId).toHaveBeenCalledWith(table, "qa-bot-junk-id");
    expect(get).not.toHaveBeenCalled();
  });

  it("returns null for a well-formed ID that does not exist", async () => {
    get.mockResolvedValue(null);
    expect(await run("missing-id")).toBeNull();
    expect(get).toHaveBeenCalledWith("normalized-id");
  });

  it("preserves organization and module checks for existing records", async () => {
    expect(await run("route-id")).toBe(record);
    expect(get).toHaveBeenCalledWith("normalized-id");
    expect(requireOrganizationAccess).toHaveBeenCalledWith(ctx, "org1");
    if (module) expect(requireModuleEnabled).toHaveBeenCalledWith(ctx, "org1", module);
    else expect(requireModuleEnabled).not.toHaveBeenCalled();
  });

  it("still rejects records the caller cannot access", async () => {
    vi.mocked(requireOrganizationAccess).mockRejectedValueOnce(new Error("Access denied"));
    await expect(run("route-id")).rejects.toThrow("Access denied");
  });
});

describe.each([
  { name: "employee documents", table: "employees", key: "employeeId", run: (employeeId: string) => invoke(listDocuments, { employeeId }) },
  { name: "employee contracts", table: "employees", key: "employeeId", run: (employeeId: string) => invoke(listContracts, { employeeId }) },
  { name: "job documents", table: "jobs", key: "jobId", run: (jobId: string) => invoke(listJobDocuments, { jobId }) },
])("$name parallel query", ({ table, key, run }) => {
  it("returns an empty list for an invalid parent ID", async () => {
    normalizeId.mockReturnValue(null);
    expect(await run("qa-bot-junk-id")).toEqual([]);
    expect(normalizeId).toHaveBeenCalledWith(table, "qa-bot-junk-id");
    expect(get).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it("returns an empty list when the parent is missing", async () => {
    get.mockResolvedValue(null);
    expect(await run("missing-id")).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });

  it("queries using the normalized ID after checking access", async () => {
    expect(await run("route-id")).toEqual([record]);
    expect(requireOrganizationAccess).toHaveBeenCalledWith(ctx, "org1");
    expect(eq).toHaveBeenCalledWith(key, "normalized-id");
  });

  it("does not list related data when access is denied", async () => {
    vi.mocked(requireOrganizationAccess).mockRejectedValueOnce(new Error("Access denied"));
    await expect(run("route-id")).rejects.toThrow("Access denied");
    expect(query).not.toHaveBeenCalled();
  });
});

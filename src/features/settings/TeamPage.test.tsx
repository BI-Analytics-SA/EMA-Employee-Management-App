import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { TeamPage } from "./TeamPage";
import { InvitesPage } from "./InvitesPage";

const mocks = vi.hoisted(() => ({
  role: "admin",
  organizationId: "org1" as string | undefined,
  isLoading: false,
  query: vi.fn(),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    organizationId: mocks.organizationId,
    isAdmin: mocks.role === "admin",
    isLoading: mocks.isLoading,
  }),
}));
vi.mock("convex/react", () => ({
  useQuery: mocks.query,
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = "admin";
  mocks.organizationId = "org1";
  mocks.isLoading = false;
  mocks.query.mockImplementation((query, args) => {
    if (args === "skip") return undefined;
    if (mocks.role !== "admin" && getFunctionName(query) === "invites/queries:listByOrganization") {
      throw new Error("Only admins can view invites");
    }
    return [];
  });
});

describe.each([
  { name: "TeamPage", Page: TeamPage, subject: "the team", queryCount: 2 },
  { name: "InvitesPage", Page: InvitesPage, subject: "invites", queryCount: 1 },
])("$name role guard", ({ Page, subject, queryCount }) => {
  it.each(["manager", "user"])("skips queries and renders the restriction for %s", (role) => {
    mocks.role = role;
    render(<Page />);
    expect(screen.getByText(`Only organization admins can manage ${subject}.`)).toHaveClass("text-destructive");
    expect(mocks.query).toHaveBeenCalledTimes(queryCount);
    expect(mocks.query.mock.calls.every(([, args]) => args === "skip")).toBe(true);
  });

  it("queries data for an admin with an organization", () => {
    render(<Page />);
    expect(screen.queryByText(`Only organization admins can manage ${subject}.`)).not.toBeInTheDocument();
    expect(mocks.query).toHaveBeenCalledTimes(queryCount);
    for (const [, args] of mocks.query.mock.calls) {
      expect(args).toEqual({ organizationId: "org1" });
    }
  });

  it("skips queries while the current profile is loading", () => {
    mocks.role = "loading";
    mocks.isLoading = true;
    render(<Page />);
    expect(screen.queryByText(`Only organization admins can manage ${subject}.`)).not.toBeInTheDocument();
    expect(mocks.query.mock.calls.every(([, args]) => args === "skip")).toBe(true);
  });

  it("skips queries when no organization is selected", () => {
    mocks.organizationId = undefined;
    render(<Page />);
    expect(mocks.query.mock.calls.every(([, args]) => args === "skip")).toBe(true);
  });
});

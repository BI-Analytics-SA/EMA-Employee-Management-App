import { isValidElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, matchRoutes, Outlet, RouterProvider, type RouteObject } from "react-router-dom";
import { EmployeeListPage } from "@/features/employees/pages/EmployeeListPage";
import { EmployeeDetailPage } from "@/features/employees/pages/EmployeeDetailPage";
import { ContractDetailPage } from "@/features/employees/pages/ContractDetailPage";
import { JobDocumentUploadPage } from "@/features/jobs/pages/JobDocumentUploadPage";
import { TeamPage } from "@/features/settings/TeamPage";
import { PlatformOrganizationsPage } from "@/features/platform/PlatformOrganizationsPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { SignInPage } from "@/features/auth/SignInPage";
import { HomePage } from "@/features/home/HomePage";
import { RequirePlatformAdmin } from "@/components/auth/RequirePlatformAdmin";
import { NotFoundPage } from "./NotFoundPage";
import { router } from "./index";

const mocks = vi.hoisted(() => ({
  isAuthenticated: true,
  isLoading: false,
  isPlatformAdmin: true,
  homeError: undefined as unknown,
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks }));
vi.mock("@/hooks/usePlatformAdmin", () => ({
  usePlatformAdmin: () => ({ isPlatformAdmin: mocks.isPlatformAdmin, isLoading: false }),
}));
vi.mock("@/components/auth/RequireProfile", () => ({ RequireProfile: () => <Outlet /> }));
vi.mock("@/components/auth/RequireActivePlan", () => ({
  RequireActivePlan: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  OrganizationProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/layout/AppShell", () => ({
  AppShell: () => <div data-testid="app-shell"><Outlet /></div>,
}));
vi.mock("@/components/layout/PlatformShell", () => ({
  PlatformShell: () => <div data-testid="platform-shell"><Outlet /></div>,
}));
vi.mock("@/features/auth/SignInPage", () => ({ SignInPage: () => <h1>Login</h1> }));
vi.mock("@/features/home/HomePage", () => ({
  HomePage: () => {
    if (mocks.homeError !== undefined) throw mocks.homeError;
    return <h1>Home</h1>;
  },
}));
vi.mock("@/features/landing/LandingPage", () => ({ LandingPage: () => <h1>Welcome</h1> }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
beforeEach(() => {
  mocks.isAuthenticated = true;
  mocks.isLoading = false;
  mocks.isPlatformAdmin = true;
  mocks.homeError = undefined;
});

describe("real route tree", () => {
  it.each([
    ["/", HomePage],
    ["/employees", EmployeeListPage],
    ["/employees/employee-id", EmployeeDetailPage],
    ["/employees/employee-id/contracts/contract-id", ContractDetailPage],
    ["/jobs/job-id/documents/upload", JobDocumentUploadPage],
    ["/settings/team", TeamPage],
    ["/platform/organizations", PlatformOrganizationsPage],
    ["/login", SignInPage],
    ["/onboarding", OnboardingPage],
  ] as const)("matches %s to its intended page instead of a splat", (path, page) => {
    const matches = matchRoutes<RouteObject>(router.routes, path);
    expect(matches).not.toBeNull();
    const leaf = matches![matches!.length - 1].route;
    expect(leaf.path).not.toBe("*");
    expect(isValidElement(leaf.element) && leaf.element.type).toBe(page);
  });

  it.each([
    ["/platform/nope", true],
    ["/qa-bot-nope", false],
    ["/login/extra", false],
    ["/onboarding/extra", false],
  ] as const)("matches %s to the correct shell's splat", (path, isPlatform) => {
    const matches = matchRoutes<RouteObject>(router.routes, path);
    expect(matches).not.toBeNull();
    const leaf = matches![matches!.length - 1].route;
    expect(leaf.path).toBe("*");
    expect(isValidElement(leaf.element) && leaf.element.type).toBe(NotFoundPage);
    expect(matches!.some(({ route }) =>
      isValidElement(route.element) && route.element.type === RequirePlatformAdmin
    )).toBe(isPlatform);
  });
});

describe("unknown routes", () => {
  it.each(["/qa-bot-nope", "/Version.json", "/version.json/x", "/employees/junk/unknown"])(
    "renders %s inside the app layout with a Home link", async (path) => {
      const memoryRouter = createMemoryRouter(router.routes, { initialEntries: [path] });
      render(<RouterProvider router={memoryRouter} />);
      expect(await screen.findByRole("heading", { name: "Page not found" })).toBeVisible();
      expect(screen.getByTestId("app-shell")).toContainElement(screen.getByRole("heading"));
      expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
      memoryRouter.dispose();
    }
  );

  it("keeps unknown platform paths in the platform shell with an Organizations link", async () => {
    const memoryRouter = createMemoryRouter(router.routes, { initialEntries: ["/platform/nope"] });
    render(<RouterProvider router={memoryRouter} />);
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeVisible();
    expect(screen.getByTestId("platform-shell")).toContainElement(screen.getByRole("heading"));
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Organizations" })).toHaveAttribute("href", "/platform/organizations");
    memoryRouter.dispose();
  });

  it("applies the platform admin guard to unknown platform paths", async () => {
    mocks.isPlatformAdmin = false;
    const memoryRouter = createMemoryRouter(router.routes, { initialEntries: ["/platform/nope"] });
    render(<RouterProvider router={memoryRouter} />);
    expect(await screen.findByRole("heading", { name: "Home" })).toBeVisible();
    expect(memoryRouter.state.location.pathname).toBe("/");
    expect(screen.queryByTestId("platform-shell")).not.toBeInTheDocument();
    memoryRouter.dispose();
  });

  it("preserves the login redirect for logged-out unknown paths, then shows the 404 after login", async () => {
    mocks.isAuthenticated = false;
    const path = "/qa-bot-nope?source=test";
    const memoryRouter = createMemoryRouter(router.routes, { initialEntries: [path] });
    render(<RouterProvider router={memoryRouter} />);
    expect(await screen.findByRole("heading", { name: "Login" })).toBeVisible();
    expect(memoryRouter.state.location.pathname).toBe("/login");
    expect(new URLSearchParams(memoryRouter.state.location.search).get("redirect")).toBe(path);
    cleanup();
    memoryRouter.dispose();

    mocks.isAuthenticated = true;
    const signedInRouter = createMemoryRouter(router.routes, { initialEntries: [path] });
    render(<RouterProvider router={signedInRouter} />);
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeVisible();
    signedInRouter.dispose();
  });

  it("keeps the public landing page at the root", async () => {
    mocks.isAuthenticated = false;
    const memoryRouter = createMemoryRouter(router.routes, { initialEntries: ["/"] });
    render(<RouterProvider router={memoryRouter} />);
    expect(await screen.findByRole("heading", { name: "Welcome" })).toBeVisible();
    memoryRouter.dispose();
  });
});

describe("root error boundary", () => {
  it("catches a page render error beneath the real app layout", async () => {
    vi.stubEnv("DEV", false);
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.homeError = new Error("private page diagnostic");
    const memoryRouter = createMemoryRouter(router.routes, { initialEntries: ["/"] });
    render(<RouterProvider router={memoryRouter} />);
    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeVisible();
    expect(screen.queryByText(/private page diagnostic/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
    memoryRouter.dispose();
  });

  function renderErrorPage(error: unknown, duringRender = false) {
    vi.spyOn(console, "error").mockImplementation(() => {});
    function BrokenPage(): ReactNode {
      throw error;
    }
    const memoryRouter = createMemoryRouter([{
      errorElement: (router.routes[0] as RouteObject).errorElement,
      HydrateFallback: () => null,
      children: [{
        path: "/",
        element: duringRender ? <BrokenPage /> : <div>Loaded</div>,
        loader: duringRender ? undefined : () => { throw error; },
      }],
    }]);
    render(<RouterProvider router={memoryRouter} />);
    return memoryRouter;
  }

  it("handles router 404 responses with friendly copy", async () => {
    const memoryRouter = renderErrorPage(new Response("Not Found", { status: 404 }));
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeVisible();
    expect(screen.queryByText(/Hey developer/)).not.toBeInTheDocument();
    memoryRouter.dispose();
  });

  it.each([false, true])("hides unexpected error details in production (render error: %s)", async (duringRender) => {
    vi.stubEnv("DEV", false);
    const memoryRouter = renderErrorPage(new Error("private Convex function and stack"), duringRender);
    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Reload page" })).toBeVisible();
    expect(screen.queryByText(/private Convex/)).not.toBeInTheDocument();
    expect(screen.queryByText("Error details")).not.toBeInTheDocument();
    memoryRouter.dispose();
  });

  it("makes error details available in development", async () => {
    vi.stubEnv("DEV", true);
    const memoryRouter = renderErrorPage(new Error("development diagnostic"));
    expect(await screen.findByText("Error details")).toBeInTheDocument();
    expect(screen.getByText(/Error: development diagnostic/)).toBeInTheDocument();
    memoryRouter.dispose();
  });

  it("serializes thrown objects in development", async () => {
    vi.stubEnv("DEV", true);
    const error = { reason: "query failed", context: { query: "employees" } };
    const memoryRouter = renderErrorPage(error);
    expect(await screen.findByText("Error details")).toBeInTheDocument();
    expect(screen.getByText(/query failed/).textContent).toBe(JSON.stringify(error, null, 2));
    memoryRouter.dispose();
  });

  it("includes route response status, status text, and data in development", async () => {
    vi.stubEnv("DEV", true);
    const memoryRouter = renderErrorPage(new Response(JSON.stringify({ reason: "temporarily unavailable" }), {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    }));
    expect(await screen.findByText("Error details")).toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/).textContent).toBe(JSON.stringify({
      status: 503,
      statusText: "Service Unavailable",
      data: { reason: "temporarily unavailable" },
    }, null, 2));
    memoryRouter.dispose();
  });

  it.each([false, true])("falls back to String for non-JSON values (circular: %s)", async (circular) => {
    vi.stubEnv("DEV", true);
    const object: { self?: unknown } = {};
    object.self = object;
    const error = circular ? object : Symbol("diagnostic");
    const memoryRouter = renderErrorPage(error);
    expect(await screen.findByText("Error details")).toBeInTheDocument();
    expect(screen.getByText(String(error))).toBeInTheDocument();
    memoryRouter.dispose();
  });
});

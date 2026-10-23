import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider, type RouteObject } from "react-router-dom";
import { router } from "./index";

const mocks = vi.hoisted(() => ({ isAuthenticated: true, isLoading: false }));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks }));
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
vi.mock("@/features/auth/SignInPage", () => ({ SignInPage: () => <h1>Login</h1> }));
vi.mock("@/features/home/HomePage", () => ({ HomePage: () => <h1>Home</h1> }));
vi.mock("@/features/landing/LandingPage", () => ({ LandingPage: () => <h1>Welcome</h1> }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
beforeEach(() => {
  mocks.isAuthenticated = true;
  mocks.isLoading = false;
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
});

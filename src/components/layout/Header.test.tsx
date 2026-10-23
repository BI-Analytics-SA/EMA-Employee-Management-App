import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), setActiveOrganization: vi.fn() }));
vi.mock("convex/react", () => ({ useQuery: () => [] }));
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ organization: { name: "Example" }, organizationId: "org1", userName: "Test User" }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganizationContext: () => ({
    organizations: [{ organization: { _id: "org1", name: "Example" } }, { organization: { _id: "org2", name: "Other org" } }],
    activeOrganizationId: "org1",
    setActiveOrganization: mocks.setActiveOrganization,
  }),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ signOut: mocks.signOut }) }));
vi.mock("@/hooks/usePlatformAdmin", () => ({ usePlatformAdmin: () => ({ isPlatformAdmin: true }) }));
vi.mock("@/hooks/useModuleEnabled", () => ({ useModuleEnabled: () => false }));
vi.mock("@/components/theme-provider", () => ({ useTheme: () => ({ theme: "light", setTheme: vi.fn() }) }));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

async function openMenu() {
  const trigger = screen.getByRole("button", { name: "User menu" });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter" });
  return screen.findByRole("menu");
}

describe("Header user menu", () => {
  it("closes on Escape and restores focus to its trigger", async () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    const menu = await openMenu();
    fireEvent.keyDown(menu, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "User menu" })).toHaveFocus());
  });

  it("dismisses on an outside pointer click and lets the same click activate the page", async () => {
    const createInvite = vi.fn();
    render(<MemoryRouter><Header /><button onClick={createInvite}>Create Invite</button></MemoryRouter>);
    await openMenu();
    const button = screen.getByRole("button", { name: "Create Invite" });
    fireEvent.pointerDown(button, { button: 0, pointerType: "mouse" });
    fireEvent.mouseDown(button);
    button.focus();
    fireEvent.pointerUp(button, { button: 0, pointerType: "mouse" });
    fireEvent.click(button);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(createInvite).toHaveBeenCalledTimes(1);
    expect(button).toHaveFocus();
    expect(document.body.style.pointerEvents).not.toBe("none");
  });

  it("keeps links, organization switching, and sign out", async () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    await openMenu();
    for (const [name, href] of [
      ["Create Organization", "/organizations/new"],
      ["Join Organization", "/organizations/new?mode=join"],
      ["Platform — Organisations", "/platform/organizations"],
      ["Profile", "/settings/profile"],
    ]) expect(screen.getByRole("menuitem", { name })).toHaveAttribute("href", href);
    fireEvent.click(screen.getByRole("menuitem", { name: "Other org" }));
    expect(mocks.setActiveOrganization).toHaveBeenCalledWith("org2");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });
});

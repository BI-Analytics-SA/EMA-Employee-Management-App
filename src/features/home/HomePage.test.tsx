import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ organizationId: "org1", userName: "Test User", isLoading: false }),
}));
vi.mock("@/hooks/useModuleEnabled", () => ({ useModuleEnabled: () => false }));
vi.mock("@/features/platform/PlatformBootstrapBanner", () => ({ PlatformBootstrapBanner: () => null }));
vi.mock("convex/react", () => ({
  useQuery: () => ({
    totalEmployees: 1,
    employeesWithoutDateEngaged: 0,
    employeesWithoutTaxNumber: 0,
    recentEmployees: [{
      _id: "employee1", firstName: "Nomsa", lastName: "Botha",
      imageUrl: "https://example.test/broken.jpg", idNumber: "123", createdAt: 0,
    }],
  }),
}));

afterEach(cleanup);

it("falls back to initials when a recent employee photo fails, retaining the row avatar size", () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  const row = screen.getByRole("link", { name: /Nomsa Botha/ });
  const photo = row.querySelector("img")!;
  expect(photo).toHaveAttribute("src", "https://example.test/broken.jpg");
  expect(photo).toHaveClass("h-10", "w-10");
  fireEvent.error(photo);
  expect(within(row).getByText("NB")).toBeVisible();
  expect(within(row).getByText("NB")).toHaveClass("h-10", "w-10");
  expect(row.querySelector("img")).toBeNull();
});

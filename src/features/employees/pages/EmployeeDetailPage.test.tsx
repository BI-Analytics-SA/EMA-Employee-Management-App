import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getFunctionName } from "convex/server";
import { EmployeeDetailPage } from "./EmployeeDetailPage";

const mocks = vi.hoisted(() => ({ employee: null as null | { _id: string; firstName?: string; lastName?: string; imageUrl?: string } }));

vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ isLoading: false }) }));
vi.mock("@/hooks/useModuleEnabled", () => ({ useModuleEnabled: () => true }));
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
  useQuery: (query: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(query) === "employees/queries:getById" ? mocks.employee : [],
}));

afterEach(cleanup);
beforeEach(() => { mocks.employee = null; });

it("shows a friendly employee-not-found message with a link to Employees", () => {
  render(
    <MemoryRouter initialEntries={["/employees/qa-bot-junk-id"]}>
      <Routes>
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText("Employee not found.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Back to list" })).toHaveAttribute("href", "/employees");
});

it("falls back to initials when the detail header photo fails, retaining its large size", () => {
  mocks.employee = { _id: "employee1", firstName: "Nomsa", lastName: "Botha", imageUrl: "https://example.test/broken.jpg" };
  render(
    <MemoryRouter initialEntries={["/employees/employee1"]}>
      <Routes>
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
  const photo = screen.getByRole("img", { name: "Nomsa Botha" });
  expect(photo).toHaveClass("h-20", "w-20", "ring-2", "ring-border");
  fireEvent.error(photo);
  expect(screen.getByText("NB")).toBeVisible();
  expect(screen.getByText("NB")).toHaveClass("h-20", "w-20", "ring-2", "text-xl");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

it("keeps the large person-icon empty state when the employee has no photo or initials", () => {
  mocks.employee = { _id: "employee1" };
  const { container } = render(
    <MemoryRouter initialEntries={["/employees/employee1"]}>
      <Routes>
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
  const avatar = container.querySelector('[aria-hidden="true"].h-20');
  expect(avatar).toHaveClass("w-20", "ring-2");
  expect(avatar?.querySelector("svg")).toHaveClass("h-8", "w-8");
});

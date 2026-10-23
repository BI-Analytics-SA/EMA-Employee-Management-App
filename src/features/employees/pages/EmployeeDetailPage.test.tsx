import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getFunctionName } from "convex/server";
import { EmployeeDetailPage } from "./EmployeeDetailPage";

vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ isLoading: false }) }));
vi.mock("@/hooks/useModuleEnabled", () => ({ useModuleEnabled: () => true }));
vi.mock("convex/react", () => ({
  useQuery: (query: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(query) === "employees/queries:getById" ? null : [],
}));

afterEach(cleanup);

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

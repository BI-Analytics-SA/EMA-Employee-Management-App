import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { EmployeeForm } from "./EmployeeForm";

vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ organization: {} }) }));
afterEach(cleanup);

describe("EmployeeForm required fields", () => {
  it("marks only ID Number and still submits with optional fields empty", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<EmployeeForm organizationId={"org1" as Id<"organizations">} onSubmit={onSubmit} />);
    const id = screen.getByRole("textbox", { name: /ID Number.*required/ });
    expect(id).toHaveAttribute("aria-required", "true");
    expect(container.querySelectorAll('label span[aria-hidden="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[aria-required="true"]')).toHaveLength(1);
    expect(screen.getByRole("combobox", { name: "Title" })).not.toHaveAttribute("aria-required");
    fireEvent.change(id, { target: { value: "9001015001087" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});

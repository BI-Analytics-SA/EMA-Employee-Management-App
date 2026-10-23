import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EmployeeAvatar } from "./EmployeeAvatar";

afterEach(cleanup);

describe("EmployeeAvatar", () => {
  it("shows the supplied photo and falls back to initials when it fails", () => {
    const employee = { firstName: "Nomsa", lastName: "Botha", imageUrl: "https://example.test/photo.jpg" };
    const { container, rerender } = render(<EmployeeAvatar employee={employee} />);
    expect(container.querySelector("img")).toHaveAttribute("src", employee.imageUrl);
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByText("NB")).toBeVisible();
    expect(container.querySelector("img")).toBeNull();
    rerender(<EmployeeAvatar employee={{ ...employee, imageUrl: "https://example.test/new-photo.jpg" }} />);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.test/new-photo.jpg");
  });

  it("uses stored initials when names are absent and an icon when all are absent", () => {
    const { container, rerender } = render(<EmployeeAvatar employee={{ initials: " nb " }} />);
    expect(screen.getByText("NB")).toBeVisible();
    rerender(<EmployeeAvatar employee={{}} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

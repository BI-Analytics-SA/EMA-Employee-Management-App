import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ContractForm } from "./ContractForm";

vi.mock("convex/react", () => ({ useMutation: () => vi.fn() }));
vi.mock("@/components/shared/SignatureCapture", () => ({ SignatureCapture: () => null }));
vi.mock("@/components/shared/RichTextEditor", () => ({ RichTextEditor: () => null }));
vi.mock("html2canvas", () => ({ default: vi.fn() }));
vi.mock("jspdf", () => ({ jsPDF: vi.fn() }));
afterEach(cleanup);

describe("ContractForm required fields", () => {
  it("marks exactly the five schema-required inputs", () => {
    const { container } = render(<ContractForm onSubmit={vi.fn()} />);
    const requiredIds = ["nameSurname", "idNumber", "employeeNo", "signedDate", "startDate"];
    expect(Array.from(container.querySelectorAll('[aria-required="true"]'), (input) => input.id)).toEqual(requiredIds);
    expect(container.querySelectorAll('label span[aria-hidden="true"]')).toHaveLength(5);
    for (const id of requiredIds) {
      const label = container.querySelector(`label[for="${id}"]`)!;
      expect(label).toHaveTextContent("*");
      expect(label).toHaveTextContent("(required)");
    }
    for (const name of ["Date Engaged", "Contract Heading", "Contract Category", "Place of Signature"]) {
      expect(screen.getByLabelText(name)).not.toHaveAttribute("aria-required");
    }
  });
});

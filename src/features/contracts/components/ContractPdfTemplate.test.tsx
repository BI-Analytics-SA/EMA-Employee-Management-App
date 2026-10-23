import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ContractPdfTemplate } from "./ContractPdfTemplate";

afterEach(cleanup);

describe("ContractPdfTemplate heading", () => {
  it.each([
    ["", "Contract of Employment"],
    ["Co Employemnt", "Co Employemnt"],
    ["Custom heading", "Custom heading"],
  ])("uses the default only for an empty heading (%s)", (contractHeading, expected) => {
    render(<ContractPdfTemplate
      companyName="Example"
      contractHeading={contractHeading}
      contractCategory=""
      placeOfSignature=""
      employeeName=""
      idNumber=""
      employeeNo=""
      signedDate=""
      startDate=""
      termsAndConditionsHtml=""
    />);
    expect(screen.getByText(expected, { exact: true })).toBeVisible();
  });
});

import { describe, it, expect } from "vitest";
import { getSafeReturnTo } from "./EditEmployeePage";

describe("EditEmployeePage getSafeReturnTo", () => {
  function params(str: string): URLSearchParams {
    return new URLSearchParams(str);
  }

  it("returns null when returnTo is missing", () => {
    expect(getSafeReturnTo(params(""))).toBe(null);
    expect(getSafeReturnTo(params("foo=bar"))).toBe(null);
  });

  it("returns path when returnTo is a valid same-origin path", () => {
    expect(getSafeReturnTo(params("returnTo=/reports/employees"))).toBe("/reports/employees");
    expect(getSafeReturnTo(params("returnTo=/employees"))).toBe("/employees");
    expect(getSafeReturnTo(params("returnTo=/"))).toBe("/");
  });

  it("returns null when returnTo does not start with /", () => {
    expect(getSafeReturnTo(params("returnTo=reports/employees"))).toBe(null);
    expect(getSafeReturnTo(params("returnTo=https://evil.com/path"))).toBe(null);
  });

  it("returns null when returnTo contains //", () => {
    expect(getSafeReturnTo(params("returnTo=/reports//employees"))).toBe(null);
    expect(getSafeReturnTo(params("returnTo=//evil.com"))).toBe(null);
  });

  it("trims whitespace", () => {
    expect(getSafeReturnTo(params("returnTo=%20/reports/employees"))).toBe("/reports/employees");
  });
});

import { describe, it, expect } from "vitest";
import {
  getVisibleColumnIds,
  DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS,
  EMPLOYEE_REPORT_COLUMNS,
} from "./employeeReportColumns";

describe("employeeReportColumns", () => {
  describe("getVisibleColumnIds", () => {
    it("returns default column ids when savedIds is null", () => {
      expect(getVisibleColumnIds(null)).toEqual(DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS);
    });

    it("returns default column ids when savedIds is empty array", () => {
      expect(getVisibleColumnIds([])).toEqual(DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS);
    });

    it("returns saved ids when all are valid", () => {
      const saved = ["name", "idNumber", "cellNumber"];
      expect(getVisibleColumnIds(saved)).toEqual(saved);
    });

    it("filters out invalid column ids and returns valid ones", () => {
      const saved = ["name", "invalidId", "idNumber"];
      expect(getVisibleColumnIds(saved)).toEqual(["name", "idNumber"]);
    });

    it("returns default when all saved ids are invalid", () => {
      expect(getVisibleColumnIds(["foo", "bar"])).toEqual(DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS);
    });
  });

  describe("EMPLOYEE_REPORT_COLUMNS", () => {
    it("includes name, idNumber, employeeNo as default visible", () => {
      const defaultIds = new Set(DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS);
      expect(defaultIds.has("name")).toBe(true);
      expect(defaultIds.has("idNumber")).toBe(true);
      expect(defaultIds.has("employeeNo")).toBe(true);
    });

    it("every column has id, label, getValue, defaultVisible", () => {
      for (const col of EMPLOYEE_REPORT_COLUMNS) {
        expect(col.id).toBeDefined();
        expect(col.label).toBeDefined();
        expect(typeof col.getValue).toBe("function");
        expect(typeof col.defaultVisible).toBe("boolean");
      }
    });
  });
});

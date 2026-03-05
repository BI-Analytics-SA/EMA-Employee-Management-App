/** Pay method: 02 = Cash, 03 = Electronic Payment */
export const PAY_METHODS = [
  { value: "02", label: "02.Cash" },
  { value: "03", label: "03.Electronic Payment" },
] as const;

/** Bank account type: S = Savings, C = Cheque */
export const BANK_ACC_TYPES = [
  { value: "S", label: "S.Savings" },
  { value: "C", label: "C.Cheque" },
] as const;

/** South African bank names (display labels) */
export const BANK_NAMES = [
  "Absa Bank",
  "African Bank",
  "African Bank Business",
  "Bidvest-Old Mutual",
  "Capitec Bank",
  "Discovery Bank",
  "First National Bank",
  "Grindrod Bank",
  "Nedbank",
  "Standard Bank",
  "Tyme Bank",
] as const;

/** Branch code by bank name (for lookup/auto-populate) */
export const BRANCH_CODES: Record<string, string> = {
  "Absa Bank": "632005",
  "African Bank": "430000",
  "African Bank Business": "430000",
  "Bidvest-Old Mutual": "462005",
  "Capitec Bank": "470010",
  "Discovery Bank": "679000",
  "First National Bank": "250655",
  "Grindrod Bank": "223626",
  "Nedbank": "198765",
  "Standard Bank": "051001",
  "Tyme Bank": "678910",
};

/** Account holder relationship: O = Own, T = 3rd Party */
export const ACC_RELATIONSHIPS = [
  { value: "O", label: "O.Own" },
  { value: "T", label: "T.3rd Party" },
] as const;

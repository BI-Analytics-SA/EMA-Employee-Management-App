import type { Doc } from "../../convex/_generated/dataModel";

export type ContractTemplateItem = {
  id: string;
  name: string;
  isDefault: boolean;
  companyName?: string;
  contractHeading?: string;
  contractCategory?: string;
  defaultTermsAndConditions?: string;
  employerSignatureStorageId?: string;
  employerSignatureUrl?: string;
};

/**
 * Returns the effective list of contract templates for an org:
 * contractTemplates if present, otherwise a single template derived from legacy contractTemplate.
 */
export function getEffectiveTemplates(
  org: Doc<"organizations"> | null | undefined
): ContractTemplateItem[] {
  if (!org?.settings) return [];
  const templates = org.settings.contractTemplates;
  if (templates && templates.length > 0) return templates as ContractTemplateItem[];
  const legacy = org.settings.contractTemplate as ContractTemplateItem | undefined;
  if (legacy) {
    return [
      {
        id: "default",
        name: "Default",
        isDefault: true,
        companyName: legacy.companyName,
        contractHeading: legacy.contractHeading,
        contractCategory: legacy.contractCategory,
        defaultTermsAndConditions: legacy.defaultTermsAndConditions,
        employerSignatureStorageId: legacy.employerSignatureStorageId,
        employerSignatureUrl: legacy.employerSignatureUrl,
      },
    ];
  }
  return [];
}

export function getDefaultTemplate(
  org: Doc<"organizations"> | null | undefined
): ContractTemplateItem | null {
  const templates = getEffectiveTemplates(org);
  return templates.find((t) => t.isDefault) ?? templates[0] ?? null;
}

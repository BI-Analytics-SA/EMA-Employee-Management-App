import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getEffectiveTemplates } from "@/lib/contractTemplates";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { SignatureCapture } from "@/components/shared/SignatureCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Plus, Trash2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";

const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-4 py-3 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-4";

export function ContractTemplatePage() {
  const { isAdmin, isLoading: userLoading } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const organization = useQuery(api.organizations.queries.getCurrentUserOrganization, undefined);
  const migrateContractTemplates = useMutation(api.organizations.mutations.migrateContractTemplates);
  const updateContractTemplate = useMutation(api.organizations.mutations.updateContractTemplate);
  const saveEmployerSignature = useMutation(api.organizations.mutations.saveEmployerSignature);
  const addContractTemplate = useMutation(api.organizations.mutations.addContractTemplate);
  const updateContractTemplateById = useMutation(api.organizations.mutations.updateContractTemplateById);
  const removeContractTemplate = useMutation(api.organizations.mutations.removeContractTemplate);
  const setDefaultContractTemplate = useMutation(api.organizations.mutations.setDefaultContractTemplate);
  const saveEmployerSignatureForTemplate = useMutation(api.organizations.mutations.saveEmployerSignatureForTemplate);
  const deleteEmployerSignatureForTemplate = useMutation(api.organizations.mutations.deleteEmployerSignatureForTemplate);
  const generateUploadUrl = useMutation(api.lib.storage.generateUploadUrl);

  const templates = useMemo(() => getEffectiveTemplates(organization ?? undefined), [organization]);
  const hasLegacyOnly = organization?.settings?.contractTemplate != null && (!organization?.settings?.contractTemplates?.length);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [contractHeading, setContractHeading] = useState("");
  const [contractCategory, setContractCategory] = useState("");
  const [defaultTermsAndConditions, setDefaultTermsAndConditions] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [adding, setAdding] = useState(false);

  const selected = selectedId ? templates.find((t) => t.id === selectedId) : null;
  const useNewApi = (organization?.settings?.contractTemplates?.length ?? 0) > 0;

  useEffect(() => {
    if (hasLegacyOnly && organization?._id && !migrating) {
      setMigrating(true);
      migrateContractTemplates({})
        .then(() => setMigrating(false))
        .catch(() => setMigrating(false));
    }
  }, [hasLegacyOnly, organization?._id, migrateContractTemplates, migrating]);

  useEffect(() => {
    if (selected) {
      setTemplateName(selected.name);
      setCompanyName(selected.companyName ?? "");
      setContractHeading(selected.contractHeading ?? "");
      setContractCategory(selected.contractCategory ?? "");
      setDefaultTermsAndConditions(selected.defaultTermsAndConditions ?? "");
    }
  }, [selected?.id, selected?.name, selected?.companyName, selected?.contractHeading, selected?.contractCategory, selected?.defaultTermsAndConditions]);

  useEffect(() => {
    if (templates.length > 0 && !selectedId) setSelectedId(templates[0].id);
  }, [templates, selectedId]);

  const handleSave = async () => {
    const orgId = organization?._id;
    if (!orgId) return;
    if (useNewApi) {
      if (!selectedId) return;
      setSaving(true);
      try {
        await updateContractTemplateById({
          organizationId: orgId,
          templateId: selectedId,
          name: templateName || undefined,
          companyName: companyName || undefined,
          contractHeading: contractHeading || undefined,
          contractCategory: contractCategory || undefined,
          defaultTermsAndConditions: defaultTermsAndConditions || undefined,
        });
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        await updateContractTemplate({
          organizationId: orgId,
          contractTemplate: {
            companyName: companyName || undefined,
            contractHeading: contractHeading || undefined,
            contractCategory: contractCategory || undefined,
            defaultTermsAndConditions: defaultTermsAndConditions || undefined,
          },
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleEmployerSignatureSave = async (file: File) => {
    const orgId = organization?._id;
    if (!orgId) return;
    if (useNewApi && !selectedId) return;
    setSavingSignature(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json();
      if (useNewApi && selectedId) {
        await saveEmployerSignatureForTemplate({ organizationId: orgId, templateId: selectedId, storageId });
      } else {
        await saveEmployerSignature({ organizationId: orgId, storageId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSignature(false);
    }
  };

  const handleRemoveSignature = async () => {
    const orgId = organization?._id;
    if (!orgId || !selectedId) return;
    try {
      await deleteEmployerSignatureForTemplate({ organizationId: orgId, templateId: selectedId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTemplate = async () => {
    const orgId = organization?._id;
    if (!orgId) return;
    setAdding(true);
    try {
      const id = await addContractTemplate({ organizationId: orgId, name: "New template" });
      setSelectedId(id);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const orgId = organization?._id;
    if (!orgId) return;
    const t = templates.find((x) => x.id === templateId);
    if (t?.isDefault) return;
    try {
      await removeContractTemplate({ organizationId: orgId, templateId });
      if (selectedId === templateId) setSelectedId(templates[0]?.id ?? null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    const orgId = organization?._id;
    if (!orgId) return;
    try {
      await setDefaultContractTemplate({ organizationId: orgId, templateId });
    } catch (err) {
      console.error(err);
    }
  };

  if (userLoading || organization === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contractsEnabled) {
    return (
      <div className="p-4 space-y-4">
        <Link to="/settings/modules">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Modules
          </Button>
        </Link>
        <p className="text-muted-foreground">The Contracts module is not enabled for your organization.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-destructive">Only organization admins can manage the contract template.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link to="/settings/modules" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Contract templates</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Set up one or more contract templates. Each has a name, default content, and its own employer signature. When creating a contract, users choose a template and its defaults are applied.
      </p>

      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <h2 className={sectionTitleClass}>Templates</h2>
        </div>
        <div className={sectionContentClass}>
          <div className="flex flex-wrap items-center gap-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                  selectedId === t.id ? "border-primary bg-muted/50" : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className="font-medium text-left hover:underline"
                >
                  {t.name}
                </button>
                {t.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                    <Star className="h-3 w-3" />
                    Default
                  </span>
                )}
                {useNewApi && (
                  <>
                    {!t.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleSetDefault(t.id)}
                      >
                        Set default
                      </Button>
                    )}
                    {!t.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTemplate(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
            {useNewApi && (
              <Button variant="outline" size="sm" onClick={handleAddTemplate} disabled={adding}>
                <Plus className="h-4 w-4 mr-1" />
                Add template
              </Button>
            )}
          </div>
        </div>
      </section>

      {selected && (
        <section className={sectionClass}>
          <div className={sectionHeaderClass}>
            <h2 className={sectionTitleClass}>
              {useNewApi ? "Edit template" : "Company &amp; defaults"}
            </h2>
          </div>
          <div className={`${sectionContentClass} space-y-4`}>
            {useNewApi && (
              <div className="space-y-2">
                <Label htmlFor="templateName" className="text-xs">Template name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Permanent, Fixed-term"
                  className="max-w-md"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-xs">Company name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme (Pty) Ltd"
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractHeading" className="text-xs">Contract heading</Label>
              <Input
                id="contractHeading"
                value={contractHeading}
                onChange={(e) => setContractHeading(e.target.value)}
                placeholder="e.g. Co-Employment"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Appears at the top of every contract PDF. Can be overridden per contract.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractCategory" className="text-xs">Contract category</Label>
              <Input
                id="contractCategory"
                value={contractCategory}
                onChange={(e) => setContractCategory(e.target.value)}
                placeholder="e.g. Limited Duration Contract Form"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Shown as the category line on the PDF. Can be overridden per contract.
              </p>
            </div>

            <RichTextEditor
              label="Default Terms and Conditions"
              content={defaultTermsAndConditions}
              onChange={setDefaultTermsAndConditions}
              placeholder="Default terms and conditions content…"
            />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Organization signatory signature</p>
              <p className="text-xs text-muted-foreground">
                Used on every contract PDF above the line for &quot;PER: EMPLOYER&quot;. Saves when you click Save in the pad.
              </p>
              {savingSignature ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving signature…
                </div>
              ) : (
                <div className="space-y-2">
                <SignatureCapture
                  existingSignatureUrl={selected.employerSignatureUrl ?? undefined}
                  onSave={handleEmployerSignatureSave}
                  label="Sign below"
                />
                {useNewApi && selected.employerSignatureUrl && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveSignature}>
                    Remove signature
                  </Button>
                )}
              </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save template"
                )}
              </Button>
            </div>
          </div>
        </section>
      )}

      {templates.length === 0 && !hasLegacyOnly && (
        <p className="text-muted-foreground text-sm">No templates yet. Run migration or add a template.</p>
      )}
    </div>
  );
}

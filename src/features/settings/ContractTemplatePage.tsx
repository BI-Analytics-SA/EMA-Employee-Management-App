import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { SignatureCapture } from "@/components/shared/SignatureCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
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
  const updateContractTemplate = useMutation(api.organizations.mutations.updateContractTemplate);
  const generateUploadUrl = useMutation(api.lib.storage.generateUploadUrl);
  const saveEmployerSignature = useMutation(api.organizations.mutations.saveEmployerSignature);

  const [companyName, setCompanyName] = useState("");
  const [contractHeading, setContractHeading] = useState("");
  const [contractCategory, setContractCategory] = useState("");
  const [defaultTermsAndConditions, setDefaultTermsAndConditions] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  const template = organization?.settings?.contractTemplate;

  useEffect(() => {
    if (template) {
      setCompanyName(template.companyName ?? "");
      setContractHeading(template.contractHeading ?? "");
      setContractCategory(template.contractCategory ?? "");
      setDefaultTermsAndConditions(template.defaultTermsAndConditions ?? "");
    }
  }, [template]);

  const handleSave = async () => {
    const orgId = organization?._id;
    if (!orgId) return;
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
  };

  const handleEmployerSignatureSave = async (file: File) => {
    const orgId = organization?._id;
    if (!orgId) return;
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
      await saveEmployerSignature({ organizationId: orgId, storageId });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSignature(false);
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
        <h1 className="text-2xl font-bold">Contract template</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Set default content for new contracts. These values will pre-fill the contract form; users can edit them per contract.
      </p>

      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <h2 className={sectionTitleClass}>Company &amp; defaults</h2>
        </div>
        <div className={`${sectionContentClass} space-y-4`}>
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
              <SignatureCapture
                existingSignatureUrl={template?.employerSignatureUrl ?? undefined}
                onSave={handleEmployerSignatureSave}
                label="Sign below"
              />
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
    </div>
  );
}

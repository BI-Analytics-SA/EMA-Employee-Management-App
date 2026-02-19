import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  contractFormSchema,
  type ContractFormValues,
  type ContractFormInput,
} from "@/lib/validations/contract";
import { SignatureCapture } from "@/components/shared/SignatureCapture";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { ContractPdfTemplate } from "./ContractPdfTemplate";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";

export type ContractFormHtmlFields = {
  termsAndConditionsHtml: string;
};

type Props = {
  defaultValues?: Partial<ContractFormInput> & Partial<ContractFormHtmlFields> | null;
  onSubmit: (values: ContractFormValues, signatureFile: File | null, html: ContractFormHtmlFields) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  /** When set, Show "Generate PDF" button and allow save without new signature (edit mode). */
  contractId?: Id<"contracts">;
  companyName?: string;
  /** Current contract signature URL for PDF generation (edit mode). */
  signatureUrl?: string | null;
  /** Organization signatory signature URL (from contract template) for PDF. */
  employerSignatureUrl?: string | null;
  /** Form id for external submit buttons (e.g. form="contract-form"). */
  formId?: string;
  /** Called when PDF generation starts or finishes so the parent can show a spinner on another button. */
  onGeneratingPdfChange?: (generating: boolean) => void;
};

export type ContractFormHandle = {
  generatePdf: () => Promise<void>;
};

const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-4 py-3 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-4";
const fieldClass = "space-y-1 w-full min-w-0 sm:min-w-[100px] sm:flex-1";
const dateFieldClass = "space-y-1 w-full min-w-0 sm:min-w-[160px] sm:flex-1";

export const ContractForm = forwardRef<ContractFormHandle, Props>(function ContractForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
  contractId,
  companyName = "",
  signatureUrl = null,
  employerSignatureUrl = null,
  formId = "contract-form",
  onGeneratingPdfChange,
}, ref) {
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [termsAndConditionsHtml, setTermsAndConditionsHtml] = useState(
    defaultValues?.termsAndConditionsHtml ?? ""
  );
  const [termsFullScreen, setTermsFullScreen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValues?.termsAndConditionsHtml !== undefined)
      setTermsAndConditionsHtml(defaultValues.termsAndConditionsHtml);
  }, [defaultValues?.termsAndConditionsHtml]);

  const generateUploadUrl = useMutation(api.lib.storage.generateUploadUrl);
  const saveContractPdf = useMutation(api.contracts.actions.saveContractPdf);

  const form = useForm<ContractFormInput, unknown, ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      nameSurname: "",
      idNumber: "",
      employeeNo: "",
      ...defaultValues,
    },
  });

  const htmlFields: ContractFormHtmlFields = {
    termsAndConditionsHtml,
  };

  const handleFormSubmit = (values: ContractFormValues) => {
    if (!contractId && !signatureFile) return;
    onSubmit(values, signatureFile, htmlFields);
  };

  const canSubmit =
    !isSubmitting && (contractId ? true : signatureFile !== null);

  const handleGeneratePdf = async () => {
    if (!contractId || !pdfContainerRef.current) return;
    setGeneratingPdf(true);
    onGeneratingPdfChange?.(true);

    // html2pdf.js cannot capture elements that aren't in the normal document flow.
    // Instead we use html2canvas + jsPDF directly: briefly append the template
    // visibly to the body, capture it, then remove it.
    const tmpDiv = document.createElement("div");
    tmpDiv.style.cssText = "width:210mm;background:#fff;color:#000;pointer-events:none;";

    // Inject inline typography styles so rich-text HTML (<p>, <h3>, <ul>, etc.)
    // keeps its spacing when rendered outside the Tailwind prose context.
    const styleTag = document.createElement("style");
    styleTag.textContent = `
      /* Mirror TipTap / ProseMirror prose-sm rendering exactly */
      .contract-pdf-body { line-height: 1.5; }
      .contract-pdf-body p { margin: 0; padding: 0; }
      .contract-pdf-body p:empty::before,
      .contract-pdf-body p:has(> br:only-child)::before { content: "\\00a0"; }
      .contract-pdf-body h1 { font-size: 1.4em; font-weight: 700; margin: 0.6em 0 0.3em; }
      .contract-pdf-body h2 { font-size: 1.2em; font-weight: 700; margin: 0.5em 0 0.2em; }
      .contract-pdf-body h3 { font-size: 1.05em; font-weight: 700; margin: 0.4em 0 0.2em; }
      .contract-pdf-body h4 { font-size: 1em; font-weight: 700; margin: 0.3em 0 0.1em; }
      .contract-pdf-body ul,
      .contract-pdf-body ol { margin: 0.3em 0; padding-left: 1.5em; }
      .contract-pdf-body li { margin: 0; }
      .contract-pdf-body strong { font-weight: 700; }
      .contract-pdf-body em { font-style: italic; }
      .contract-pdf-body u { text-decoration: underline; }
    `;
    tmpDiv.appendChild(styleTag);

    // Create a content wrapper and inject the template HTML
    const contentWrapper = document.createElement("div");
    contentWrapper.innerHTML = pdfContainerRef.current.innerHTML;
    tmpDiv.appendChild(contentWrapper);

    // Mark every block in the terms body as keep-together so we never cut through
    // a paragraph, heading, or list item (avoids mid-sentence page breaks).
    const body = contentWrapper.querySelector(".contract-pdf-body");
    if (body) {
      const blocks = body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li");
      blocks.forEach((el) => el.classList.add("pdf-keep-together"));
    }

    document.body.appendChild(tmpDiv);

    try {
      // Wait for all images inside the clone to load before measuring
      const images = Array.from(tmpDiv.querySelectorAll("img"));
      await Promise.all(
        images.map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((res) => {
                  img.onload = () => res();
                  img.onerror = () => res();
                })
        )
      );

      // Wait two frames so the browser fully lays out the element
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r()))
      );

      // --- Collect keep-together block positions (in DOM px, relative to tmpDiv) ---
      const containerRect = tmpDiv.getBoundingClientRect();
      const keepBlocks = Array.from(tmpDiv.querySelectorAll(".pdf-keep-together")).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: r.top - containerRect.top,
          bottom: r.bottom - containerRect.top,
        };
      });
      const domHeight = tmpDiv.scrollHeight;

      // Debug: log positions so we can verify
      console.log("[PDF] domHeight:", domHeight, "containerRect.height:", containerRect.height);
      keepBlocks.forEach((b, i) => console.log(`[PDF] keep-block ${i}: top=${b.top.toFixed(1)} bottom=${b.bottom.toFixed(1)} height=${(b.bottom - b.top).toFixed(1)}`));

      // Capture the element as a canvas
      const canvas = await html2canvas(tmpDiv, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        height: domHeight, // ensure full height is captured
      });

      // Build the PDF
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const footerHeight = 10; // Reserved for "Page X of Y"
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2 - footerHeight; // Content area only; footer below

      // Ratio: canvas pixels per DOM pixel
      const canvasScale = canvas.height / domHeight;
      // How many canvas pixels fit on one PDF page?
      const pageCanvasPx = Math.round((usableH / usableW) * canvas.width);

      // Convert keep-together blocks to canvas pixel coordinates with a safety buffer
      const buffer = 10 * canvasScale; // 10 DOM px buffer above and below
      const keepRanges = keepBlocks.map((b) => ({
        top: Math.round(b.top * canvasScale - buffer),
        bottom: Math.round(b.bottom * canvasScale + buffer),
      }));

      console.log("[PDF] canvasScale:", canvasScale.toFixed(2), "pageCanvasPx:", pageCanvasPx, "canvas:", canvas.width, "x", canvas.height);
      keepRanges.forEach((r, i) => console.log(`[PDF] keepRange ${i}: top=${r.top} bottom=${r.bottom}`));

      // Determine smart slice points that avoid cutting through keep-together blocks.
      // Walk through the canvas height, choosing page breaks that don't split blocks.
      const slicePoints: number[] = [0]; // start of first page
      let cursor = 0;
      while (cursor + pageCanvasPx < canvas.height) {
        let idealCut = cursor + pageCanvasPx;
        // Check if this cut would split any keep-together block
        for (const range of keepRanges) {
          if (range.top < idealCut && range.bottom > idealCut) {
            // Move the cut to just before the block so the block stays on the next page
            idealCut = Math.max(cursor + 1, range.top);
            // If that didn't advance (block taller than a page), move cut past the block to avoid infinite loop
            if (idealCut <= cursor) {
              idealCut = range.bottom;
            }
            console.log(`[PDF] Adjusted cut from ${cursor + pageCanvasPx} to ${idealCut} to avoid splitting block (top=${range.top}, bottom=${range.bottom})`);
            break;
          }
        }
        slicePoints.push(idealCut);
        cursor = idealCut;
      }
      slicePoints.push(canvas.height); // end of last page
      console.log("[PDF] slicePoints:", slicePoints);

      // Render each page slice
      const imgW = usableW;
      for (let i = 0; i < slicePoints.length - 1; i++) {
        if (i > 0) pdf.addPage();
        const srcY = slicePoints[i];
        const sliceH = slicePoints[i + 1] - srcY;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        }

        const sliceImgData = sliceCanvas.toDataURL("image/jpeg", 0.98);
        const sliceImgH = (sliceH / canvas.width) * usableW;
        pdf.addImage(sliceImgData, "JPEG", margin, margin, imgW, sliceImgH);
      }

      // Stamp "Page X of Y" in the footer of every page (right-aligned)
      const totalPageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        const pageText = `Page ${i} of ${totalPageCount}`;
        const textWidth = pdf.getTextWidth(pageText);
        const footerY = pageH - margin - 4;
        pdf.text(pageText, pageW - margin - textWidth, footerY);
      }

      const blob = pdf.output("blob");

      // Upload to Convex storage
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: blob,
      });
      if (!response.ok) throw new Error("PDF upload failed");
      const { storageId } = await response.json();
      await saveContractPdf({ contractId, storageId });
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      document.body.removeChild(tmpDiv);
      setGeneratingPdf(false);
      onGeneratingPdfChange?.(false);
    }
  };

  useImperativeHandle(ref, () => ({
    generatePdf: handleGeneratePdf,
  }), [handleGeneratePdf]);

  const values = form.watch();
  const pdfProps = {
    companyName,
    contractHeading: values.contractHeading ?? "",
    contractCategory: values.contractCategory ?? "",
    placeOfSignature: values.placeOfSignature ?? "",
    employeeName: values.nameSurname ?? "",
    idNumber: values.idNumber ?? "",
    employeeNo: values.employeeNo ?? "",
    signedDate: values.signedDate != null && values.signedDate !== "" ? String(new Date(values.signedDate).getTime()) : "",
    startDate: values.startDate != null && values.startDate !== "" ? String(new Date(values.startDate).getTime()) : "",
    dateEngaged: values.dateEngaged != null && values.dateEngaged !== "" ? String(new Date(values.dateEngaged).getTime()) : undefined,
    termsAndConditionsHtml,
    signatureImageUrl: signatureUrl,
    employerSignatureUrl: employerSignatureUrl ?? null,
  };

  return (
    <>
      <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="flex flex-wrap gap-3">
          <section className={cn(sectionClass, "w-full sm:w-auto sm:min-w-[340px] sm:flex-1")}>
            <div className={sectionHeaderClass}>
              <h3 className={sectionTitleClass}>Contract details</h3>
            </div>
            <div className={sectionContentClass}>
              <div className="flex flex-wrap gap-2">
                <div className={fieldClass}>
                  <Label htmlFor="nameSurname" className="text-xs">Name &amp; Surname</Label>
                  <Input
                    id="nameSurname"
                    {...form.register("nameSurname")}
                  />
                  {form.formState.errors.nameSurname && (
                    <p className="text-xs text-destructive">{form.formState.errors.nameSurname.message}</p>
                  )}
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="idNumber" className="text-xs">ID Number</Label>
                  <Input id="idNumber" {...form.register("idNumber")} />
                  {form.formState.errors.idNumber && (
                    <p className="text-xs text-destructive">{form.formState.errors.idNumber.message}</p>
                  )}
                </div>
                <div className={fieldClass}>
                  <Label htmlFor="employeeNo" className="text-xs">Employee No</Label>
                  <Input id="employeeNo" {...form.register("employeeNo")} />
                  {form.formState.errors.employeeNo && (
                    <p className="text-xs text-destructive">{form.formState.errors.employeeNo.message}</p>
                  )}
                </div>
                <div className={dateFieldClass}>
                  <Label htmlFor="signedDate" className="text-xs">Signed Date</Label>
                  <Input
                    id="signedDate"
                    type="date"
                    {...form.register("signedDate")}
                  />
                  {form.formState.errors.signedDate && (
                    <p className="text-xs text-destructive">{form.formState.errors.signedDate.message}</p>
                  )}
                </div>
                <div className={dateFieldClass}>
                  <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register("startDate")}
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div className={dateFieldClass}>
                  <Label htmlFor="dateEngaged" className="text-xs">Date Engaged</Label>
                  <Input
                    id="dateEngaged"
                    type="date"
                    {...form.register("dateEngaged")}
                  />
                </div>
                <div className={cn(fieldClass, "sm:min-w-[200px]")}>
                  <Label htmlFor="contractHeading" className="text-xs">Contract Heading</Label>
                  <Input
                    id="contractHeading"
                    {...form.register("contractHeading")}
                    placeholder="e.g. Co-Employment"
                  />
                </div>
                <div className={cn(fieldClass, "sm:min-w-[200px]")}>
                  <Label htmlFor="contractCategory" className="text-xs">Contract Category</Label>
                  <Input
                    id="contractCategory"
                    {...form.register("contractCategory")}
                    placeholder="e.g. Limited Duration Contract Form"
                  />
                </div>
                <div className={cn(fieldClass, "sm:min-w-[200px]")}>
                  <Label htmlFor="placeOfSignature" className="text-xs">Place of Signature</Label>
                  <Input
                    id="placeOfSignature"
                    {...form.register("placeOfSignature")}
                    placeholder="e.g. East London"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className={cn(sectionClass, "w-full mt-3")}>
          <div className={cn(sectionHeaderClass, "flex items-center justify-between gap-2")}>
            <h3 className={sectionTitleClass}>Terms and Conditions</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setTermsFullScreen(true)}
              aria-label="Expand Terms and Conditions to full screen"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Full screen
            </Button>
          </div>
          {!termsFullScreen && (
            <div className={sectionContentClass}>
              <RichTextEditor
                content={termsAndConditionsHtml}
                onChange={setTermsAndConditionsHtml}
                placeholder="Terms and conditions content…"
              />
            </div>
          )}
        </section>

        {/* Full-screen overlay for Terms and Conditions */}
        {termsFullScreen && (
          <div
            className="fixed inset-0 z-50 flex flex-col bg-background"
            role="dialog"
            aria-modal="true"
            aria-label="Terms and Conditions (full screen)"
          >
            <div className="flex items-center justify-between gap-4 shrink-0 border-b bg-muted/70 px-4 py-3 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Terms and Conditions</h3>
              <Button
                type="button"
                variant="default"
                size="lg"
                className="shrink-0 font-medium shadow-md"
                onClick={() => setTermsFullScreen(false)}
                aria-label="Exit full screen and return to contract"
              >
                <Minimize2 className="h-5 w-5 mr-2" />
                Return to contract
              </Button>
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <RichTextEditor
                content={termsAndConditionsHtml}
                onChange={setTermsAndConditionsHtml}
                placeholder="Terms and conditions content…"
                fillHeight
                className="h-full min-h-0"
              />
            </div>
          </div>
        )}

        <section className={cn(sectionClass, "w-full mt-3")}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Employee signature</h3>
          </div>
          <div className={sectionContentClass}>
            <SignatureCapture
              existingSignatureUrl={signatureUrl ?? undefined}
              onSave={(file) => setSignatureFile(file)}
              label="Sign below"
            />
          </div>
        </section>

        <div className="flex flex-wrap gap-2 mt-4 w-full">
          <Button type="submit" disabled={!canSubmit} className="flex-1 min-w-[120px]">
            {submitLabel}
          </Button>
          {contractId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              className="flex-1 min-w-[120px]"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Generating…
                </>
              ) : (
                "Generate PDF"
              )}
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 min-w-[120px]">
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* Hidden container for PDF template HTML — only its innerHTML is read,
          then rendered visibly in a temp element during PDF capture. */}
      <div
        ref={pdfContainerRef}
        style={{ display: "none" }}
        aria-hidden
      >
        <ContractPdfTemplate {...pdfProps} />
      </div>
    </>
  );
});

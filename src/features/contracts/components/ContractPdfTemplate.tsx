/**
 * Renders the contract as styled HTML for PDF generation.
 */
type Props = {
  companyName: string;
  contractHeading: string;
  contractCategory: string;
  placeOfSignature: string;
  employeeName: string;
  idNumber: string;
  employeeNo: string;
  signedDate: string;
  startDate: string;
  dateEngaged?: string;
  termsAndConditionsHtml: string;
  signatureImageUrl?: string | null;
  employerSignatureUrl?: string | null;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export function ContractPdfTemplate({
  companyName,
  contractHeading,
  contractCategory,
  placeOfSignature,
  employeeName,
  idNumber,
  employeeNo,
  signedDate,
  startDate,
  dateEngaged,
  termsAndConditionsHtml,
  signatureImageUrl,
  employerSignatureUrl,
}: Props) {
  const signedDateStr = signedDate ? formatDate(Number(signedDate)) : "";
  const startDateStr = startDate ? formatDate(Number(startDate)) : "";
  const dateEngagedStr = dateEngaged ? formatDate(Number(dateEngaged)) : "";

  return (
    <div className="contract-pdf-root" style={{ fontFamily: "system-ui, sans-serif", fontSize: "11pt", color: "#000", padding: "24px", maxWidth: "210mm" }}>
      <header style={{ marginBottom: "16px", borderBottom: "1px solid #ccc", paddingBottom: "8px" }}>
        <div style={{ fontWeight: 700, marginBottom: "4px" }}>{contractHeading || "Co-Employment"}</div>
        <div>
          <span>{companyName || "—"}</span>
        </div>
        <div style={{ marginTop: "4px", fontSize: "10pt", color: "#444" }}>
          Category: {contractCategory || "Limited Duration Contract Form"}
        </div>
        <div>Date: {signedDateStr || "—"}</div>
      </header>

      <p style={{ marginTop: "12px", marginBottom: "8px" }}>
        Dear {employeeName || "—"}
        <br />
        <span style={{ fontSize: "10pt" }}>({idNumber || "—"})</span>
      </p>

      <section style={{ marginTop: "16px" }}>
        <h2 style={{ fontSize: "12pt", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase" }}>
          Terms and Conditions
        </h2>
        <div
          className="prose prose-sm max-w-none contract-pdf-body"
          dangerouslySetInnerHTML={{ __html: termsAndConditionsHtml || "<p></p>" }}
          style={{ marginBottom: "16px", lineHeight: 1.4 }}
        />
      </section>

      {/* Employer sign-off block — must stay together */}
      <div className="pdf-keep-together" style={{ marginTop: "20px" }}>
        <p style={{ marginBottom: "8px" }}>Yours sincerely</p>
        {employerSignatureUrl ? (
          <p style={{ marginBottom: "8px" }}>
            <img
              src={employerSignatureUrl}
              alt="Employer signature"
              style={{ maxWidth: "200px", maxHeight: "60px", borderBottom: "1px solid #000" }}
            />
          </p>
        ) : (
          <p style={{ marginBottom: "24px" }}>_______________</p>
        )}
        <p style={{ fontSize: "10pt", marginBottom: "16px" }}>PER: EMPLOYER</p>
      </div>

      {/* Employee acceptance + signature block — must stay together */}
      <div className="pdf-keep-together" style={{ marginTop: "16px" }}>
        <p style={{ marginBottom: "8px" }}>
          I, {employeeName || "—"} hereby accept the terms and conditions.
        </p>
        <p style={{ marginBottom: "16px", fontSize: "10pt" }}>
          Dated at {placeOfSignature || "—"} on this {signedDateStr || "—"}
        </p>

        <p style={{ fontWeight: 700, marginTop: "16px", marginBottom: "8px" }}>SIGNATURE OF APPLICANT</p>
        {signatureImageUrl ? (
          <img
            src={signatureImageUrl}
            alt="Employee signature"
            style={{ maxWidth: "200px", maxHeight: "80px", borderBottom: "1px solid #000" }}
          />
        ) : (
          <div style={{ width: "200px", height: "60px", borderBottom: "1px solid #ccc" }} />
        )}
        {startDateStr && (
          <p style={{ marginTop: "16px", fontSize: "10pt", color: "#444" }}>
            Start date: {startDateStr}
            {dateEngagedStr && ` · Date engaged: ${dateEngagedStr}`}
            {employeeNo && ` · Employee no: ${employeeNo}`}
          </p>
        )}
      </div>
    </div>
  );
}

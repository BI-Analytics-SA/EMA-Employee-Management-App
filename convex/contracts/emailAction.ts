"use node";

import { action } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { Resend } from "resend";
import { internal } from "../_generated/api";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send the generated contract PDF to an employee (or any provided email) via Resend.
 * The PDF is fetched from Convex storage and attached to the email.
 */
export const sendContractEmail = action({
  args: {
    contractId: v.id("contracts"),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    if (!/^\S+@\S+\.\S+$/.test(args.recipientEmail)) {
      throw new ConvexError("Invalid recipient email address");
    }

    const contractData = await ctx.runQuery(
      internal.contracts.queries.getContractForEmail,
      { contractId: args.contractId }
    );

    if (!contractData) {
      throw new Error("Contract not found");
    }

    if (!contractData.pdfUrl) {
      throw new ConvexError("No PDF has been generated for this contract yet. Please generate the PDF first.");
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error("RESEND_FROM_EMAIL environment variable is not set");
    }

    const resend = new Resend(resendApiKey);

    // Fetch the PDF from Convex storage with a timeout to avoid hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let pdfBuffer: ArrayBuffer;
    try {
      const pdfResponse = await fetch(contractData.pdfUrl, { signal: controller.signal });
      if (!pdfResponse.ok) {
        throw new ConvexError(`Failed to fetch contract PDF: ${pdfResponse.statusText}`);
      }
      pdfBuffer = await pdfResponse.arrayBuffer();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ConvexError("Timed out fetching the contract PDF from storage. Please try again.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const employeeName = contractData.nameSurname || "Employee";
    const orgName = contractData.organizationName;
    const filename = `contract-${employeeName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [args.recipientEmail],
      subject: `Your Employment Contract – ${orgName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Employment Contract</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #6366f1; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Employment Contract</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Dear ${escapeHtml(employeeName)},
              </p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Please find your employment contract with <strong>${escapeHtml(orgName)}</strong> attached to this email.
              </p>

              <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                Please review the document carefully. If you have any questions, please contact your HR department.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                This email was sent to ${escapeHtml(args.recipientEmail)} by ${escapeHtml(orgName)}.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Dear ${employeeName},

Please find your employment contract with ${orgName} attached to this email.

Please review the document carefully. If you have any questions, please contact your HR department.

This email was sent to ${args.recipientEmail} by ${orgName}.
      `.trim(),
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      console.error("Failed to send contract email:", error);
      throw new ConvexError(`Failed to send email: ${error.message}`);
    }

    // Record when and to whom the contract was emailed
    await ctx.runMutation(internal.contracts.mutations.recordEmailSent, {
      contractId: args.contractId,
      sentTo: args.recipientEmail,
    });

    return { success: true };
  },
});

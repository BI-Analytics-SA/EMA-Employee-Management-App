"use node";

import { action } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { Resend } from "resend";
import { api } from "../_generated/api";

/**
 * Send an invite email using Resend
 */
export const sendInviteEmail = action({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    // Get the invite details
    const invite = await ctx.runQuery(api.invites.queries.getInviteForEmail, {
      inviteId: args.inviteId,
    });

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (!invite.email) {
      throw new ConvexError("Invite does not have an email address");
    }

    // Initialize Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const resend = new Resend(resendApiKey);

    // Build the invite link
    const siteUrl = process.env.SITE_URL || "http://localhost:5173";
    const inviteLink = `${siteUrl}/onboarding?invite=${invite.code}`;

    // Send the email
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Employee Management <onboarding@resend.dev>",
      to: [invite.email],
      subject: `You've been invited to join ${invite.organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You're Invited!</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #6366f1; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">You're Invited!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hi there! 👋
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                You've been invited to join <strong>${invite.organizationName}</strong> as a <strong>${invite.role}</strong> on our Employee Management platform.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                Invited by: ${invite.inviterName}
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
                ${inviteLink}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                This invite was sent to ${invite.email}.<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
You've been invited to join ${invite.organizationName}!

Hi there!

You've been invited to join ${invite.organizationName} as a ${invite.role} on our Employee Management platform.

Invited by: ${invite.inviterName}

Click the link below to accept your invitation:
${inviteLink}

If you didn't expect this invitation, you can safely ignore this email.
      `.trim(),
    });

    if (error) {
      console.error("Failed to send invite email:", error);
      throw new ConvexError("Failed to send invite email");
    }

    // Mark invite as email sent
    await ctx.runMutation(api.invites.mutations.markEmailSent, {
      inviteId: args.inviteId,
    });

    return { success: true };
  },
});

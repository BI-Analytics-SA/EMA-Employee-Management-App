import Resend from "@auth/core/providers/resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 8);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Employee Management <onboarding@resend.dev>";

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #6366f1; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reset Your Password</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px; margin-bottom: 20px;">
        You requested a password reset for your Employee Management account.
      </p>
      <p style="font-size: 16px; margin-bottom: 8px;">
        Enter the following code on the reset page:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; background: #fff; border: 2px solid #6366f1; border-radius: 8px; padding: 14px 32px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e1b4b;">
          ${token}
        </span>
      </div>
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
        This code expires shortly. If you did not request a password reset, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
        This email was sent to ${email}.<br>
        If you didn't request this, you can safely ignore it.
      </p>
    </div>
  </body>
</html>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Reset your password",
        html,
        text: `Reset your password\n\nYour password reset code is: ${token}\n\nThis code expires shortly. If you did not request a password reset, you can safely ignore this email.`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Failed to send password reset email:", body);
      throw new Error("Could not send password reset email");
    }
  },
});

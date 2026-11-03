// server/src/services/emailService.ts

// Email dispatch service using Resend with local terminal fallback when API key is omitted.

import { Resend } from 'resend';
import { env } from '../config/env.js';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Initialize Resend client only if API key is provided
const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const DEFAULT_FROM_ADDRESS = 'Antigravity Finance <onboarding@resend.dev>';

/**
 * Renders an ASCII box in the terminal containing the email details for local testing.
 */
export const logEmailToConsole = (
  type: 'Verification OTP' | 'Password Reset Code',
  to: string,
  code: string,
  expiresInMinutes: number = 15
): void => {
  const line = '─'.repeat(56);
  const title = `ANTIGRAVITY FINANCE EMAIL: ${type.toUpperCase()}`.padEnd(52);
  const recipientLine = `To:      ${to}`.padEnd(52);
  const codeLine = `Code:    ${code}  (Expires in ${expiresInMinutes}m)`.padEnd(52);
  const noteLine = `Note:    RESEND_API_KEY omitted, using dev fallback`.padEnd(52);

  console.log(`
┌${line}┐
│ ${title} │
├${line}┤
│ ${recipientLine} │
│ ${codeLine} │
│ ${noteLine} │
└${line}┘
`);
};

/**
 * Generates responsive HTML markup for verification OTP email.
 */
const getVerificationHtml = (code: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; color: #f8fafc;">
          <tr>
            <td align="center">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #38bdf8;">Antigravity Finance</h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">
                Welcome! Please use the following 6-digit verification code to complete your account registration:
              </p>
              <div style="background-color: #0f172a; border-radius: 8px; border: 1px solid #475569; padding: 18px 24px; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #38bdf8; display: inline-block; margin-bottom: 24px;">
                ${code}
              </div>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8;">
                This code expires in <strong>15 minutes</strong>. If you did not create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Generates responsive HTML markup for password reset email.
 */
const getPasswordResetHtml = (code: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; color: #f8fafc;">
          <tr>
            <td align="center">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #f43f5e;">Antigravity Finance</h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">
                We received a request to reset your password. Use the verification code below to set a new password:
              </p>
              <div style="background-color: #0f172a; border-radius: 8px; border: 1px solid #475569; padding: 18px 24px; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #f43f5e; display: inline-block; margin-bottom: 24px;">
                ${code}
              </div>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8;">
                This code expires in <strong>15 minutes</strong>. If you did not request a password reset, please secure your account immediately.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Sends a 6-digit email verification OTP.
 */
export const sendVerificationEmail = async (to: string, otp: string): Promise<SendEmailResult> => {
  if (!resendClient) {
    logEmailToConsole('Verification OTP', to, otp);
    return { success: true, messageId: 'mock-verification-email' };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: DEFAULT_FROM_ADDRESS,
      to,
      subject: `Your verification code is ${otp} — Antigravity Finance`,
      html: getVerificationHtml(otp),
    });

    if (error) {
      console.warn(`Resend failed to send verification email to ${to}:`, error);
      // Fallback to console log in dev/test to avoid blocking workflows
      if (env.NODE_ENV !== 'production') {
        logEmailToConsole('Verification OTP', to, otp);
        return { success: true, messageId: 'fallback-verification-email' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.warn(`Error dispatching verification email to ${to}:`, err);
    if (env.NODE_ENV !== 'production') {
      logEmailToConsole('Verification OTP', to, otp);
      return { success: true, messageId: 'fallback-verification-email' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown email dispatch error',
    };
  }
};

/**
 * Sends a 6-digit password reset code.
 */
export const sendPasswordResetEmail = async (
  to: string,
  code: string
): Promise<SendEmailResult> => {
  if (!resendClient) {
    logEmailToConsole('Password Reset Code', to, code);
    return { success: true, messageId: 'mock-reset-email' };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: DEFAULT_FROM_ADDRESS,
      to,
      subject: `Your password reset code is ${code} — Antigravity Finance`,
      html: getPasswordResetHtml(code),
    });

    if (error) {
      console.warn(`Resend failed to send password reset email to ${to}:`, error);
      if (env.NODE_ENV !== 'production') {
        logEmailToConsole('Password Reset Code', to, code);
        return { success: true, messageId: 'fallback-reset-email' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.warn(`Error dispatching password reset email to ${to}:`, err);
    if (env.NODE_ENV !== 'production') {
      logEmailToConsole('Password Reset Code', to, code);
      return { success: true, messageId: 'fallback-reset-email' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown email dispatch error',
    };
  }
};

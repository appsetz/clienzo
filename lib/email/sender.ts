/**
 * Email Sender Service
 * 
 * This service handles sending emails via Resend.
 * All automation logic (when, what, to whom) is handled by Clienova.
 */

import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Sender email address
const SENDER_EMAIL = "support@clienova.com";

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  agencyName: string;
  replyToEmail: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== "");
}

/**
 * Send email via Resend
 * 
 * Rules:
 * - From: support@clienova.com
 * - FromName: agencyName (dynamic)
 * - Reply-To: replyToEmail (dynamic)
 * 
 * @param params Email parameters
 * @returns Result with success status and message ID or error
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, htmlBody, textBody, agencyName, replyToEmail } = params;

  // Validate required fields
  if (!to || !subject || !htmlBody || !agencyName || !replyToEmail) {
    return {
      success: false,
      error: "Missing required email parameters",
    };
  }

  // Check if email service is configured
  if (!isEmailConfigured()) {
    console.error("Resend API key not configured. Please set RESEND_API_KEY environment variable.");
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    // From format: "Agency Name <support@clienova.com>"
    const fromEmail = `${agencyName} <${SENDER_EMAIL}>`;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: htmlBody,
      text: textBody || htmlToText(htmlBody),
      replyTo: replyToEmail,
    });

    if (error) {
      console.error("Resend send error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    if (data && data.id) {
      return {
        success: true,
        messageId: data.id,
      };
    } else {
      return {
        success: false,
        error: "No message ID returned from Resend",
      };
    }
  } catch (error: any) {
    console.error("Resend send error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract text from HTML (simple version for textBody fallback)
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Send email with PDF attachment via Resend
 * 
 * @param params Email parameters with PDF attachment
 * @returns Result with success status and message ID or error
 */
export async function sendEmailWithPDFAttachment(params: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  agencyName: string;
  replyToEmail: string;
  pdfBuffer: Buffer;
  pdfFileName: string;
}): Promise<SendEmailResult> {
  const { to, subject, htmlBody, textBody, agencyName, replyToEmail, pdfBuffer, pdfFileName } = params;

  // Validate required fields
  if (!to || !subject || !htmlBody || !agencyName || !replyToEmail || !pdfBuffer) {
    return {
      success: false,
      error: "Missing required email parameters",
    };
  }

  // Check if email service is configured
  if (!isEmailConfigured()) {
    console.error("Resend API key not configured. Please set RESEND_API_KEY environment variable.");
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    // From format: "Agency Name <support@clienova.com>"
    const fromEmail = `${agencyName} <${SENDER_EMAIL}>`;

    // Convert PDF buffer to base64 for Resend
    const pdfBase64 = pdfBuffer.toString("base64");

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: htmlBody,
      text: textBody || htmlToText(htmlBody),
      replyTo: replyToEmail,
      attachments: [
        {
          filename: pdfFileName,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error("Resend send email with attachment error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email with attachment",
      };
    }

    if (data && data.id) {
      return {
        success: true,
        messageId: data.id,
      };
    } else {
      return {
        success: false,
        error: "No message ID returned from Resend",
      };
    }
  } catch (error: any) {
    console.error("Resend send email with attachment error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email with attachment",
    };
  }
}

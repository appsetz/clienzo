/**
 * Email Queue Worker API Route
 * 
 * This endpoint processes the email queue and sends emails via your email provider.
 * Should be called periodically (every 5 minutes) via cron job.
 * 
 * Worker Logic:
 * 1. Fetch pending emails where send_at <= now
 * 2. Send via email provider
 * 3. Update status (sent/failed)
 * 4. Retry up to 3 times on failure
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { sendEmail } from "@/lib/email/sender";
import { logEmail } from "@/lib/email/service";
import { EmailQueueItem } from "@/lib/email/types";

// Maximum retry attempts
const MAX_RETRIES = 3;

/**
 * Process email queue
 * GET /api/email/process-queue
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check here
    // For production, you might want to verify a secret token
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // If CRON_SECRET is set, require authentication
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Fetch pending emails that are ready to send
    const q = query(
      collection(db, "email_queue"),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);
    const emailsToProcess: EmailQueueItem[] = [];

    // Filter emails that are ready to send (send_at <= now)
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const sendAt = data.sendAt?.toDate();

      if (sendAt && sendAt <= now) {
        emailsToProcess.push({
          id: docSnapshot.id,
          ...data,
          sendAt,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as EmailQueueItem);
      }
    });

    if (emailsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No emails to process",
      });
    }

    // Process each email
    const results = {
      sent: 0,
      failed: 0,
      retried: 0,
    };

    for (const email of emailsToProcess) {
      try {
        let result: any;

        // Check if this is an invoice email with PDF attachment
        if (email.emailType === "invoice" && email.invoiceData) {
          // Generate PDF and send email with attachment
          const { generateInvoicePDF } = await import("@/lib/email/pdf-generator");
          const { sendEmailWithPDFAttachment } = await import("@/lib/email/sender");
          
          try {
            // Deserialize invoiceData: convert ISO strings back to Date objects
            const deserializeInvoiceData = (data: any): any => {
              if (!data) return data;
              // Recursively convert ISO date strings back to Date objects
              if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
                return new Date(data);
              }
              if (Array.isArray(data)) {
                return data.map(deserializeInvoiceData);
              }
              if (typeof data === 'object' && data !== null) {
                const result: any = {};
                for (const key in data) {
                  result[key] = deserializeInvoiceData(data[key]);
                }
                return result;
              }
              return data;
            };
            
            const invoiceData = deserializeInvoiceData(email.invoiceData);
            
            // Generate PDF from invoice data
            const pdfBuffer = await generateInvoicePDF(
              invoiceData,
              email.userProfile || {},
              "classic"
            );

            // Send email with PDF attachment
            result = await sendEmailWithPDFAttachment({
              to: email.to,
              subject: email.subject,
              htmlBody: email.body,
              agencyName: email.fromName,
              replyToEmail: email.replyTo,
              pdfBuffer,
              pdfFileName: `Invoice-${invoiceData.invoiceNumber}.pdf`,
            });
          } catch (pdfError: any) {
            console.error(`Error generating PDF for email ${email.id}:`, pdfError);
            result = {
              success: false,
              error: `PDF generation failed: ${pdfError.message || "Unknown error"}`,
            };
          }
        } else {
          // Regular template-based email
          const { sendEmail } = await import("@/lib/email/sender");
          result = await sendEmail({
            to: email.to,
            subject: email.subject,
            htmlBody: email.body,
            agencyName: email.fromName,
            replyToEmail: email.replyTo,
          });
        }

        if (result.success && result.messageId) {
          // Email sent successfully
          await updateDoc(doc(db, "email_queue", email.id), {
            status: "sent",
            sentAt: Timestamp.now(),
            messageId: result.messageId,
          });

          // Log successful email
          await logEmail(
            email.userId,
            email.to,
            email.subject,
            email.templateName || "Email Template",
            (email.event as any) || "CLIENT_CREATED",
            "sent"
          );

          results.sent++;
        } else {
          // Email failed to send
          const errorMsg = result.error || "Unknown error";
          console.error(`Email ${email.id} failed to send:`, {
            to: email.to,
            subject: email.subject,
            error: errorMsg,
            result: result,
          });
          await handleEmailFailure(email, errorMsg, results);
        }
      } catch (error: any) {
        // Unexpected error during processing
        const errorMsg = error.message || "Unexpected error";
        console.error(`Error processing email ${email.id}:`, {
          to: email.to,
          subject: email.subject,
          error: errorMsg,
          fullError: error,
        });
        await handleEmailFailure(email, errorMsg, results);
      }
    }

    return NextResponse.json({
      success: true,
      processed: emailsToProcess.length,
      results,
      message: `Processed ${emailsToProcess.length} emails`,
    });
  } catch (error: any) {
    console.error("Email queue worker error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process email queue",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle email sending failure
 * Implements retry logic with exponential backoff
 */
async function handleEmailFailure(
  email: EmailQueueItem,
  errorMessage: string,
  results: { sent: number; failed: number; retried: number }
) {
  const retryCount = email.retryCount + 1;

  if (retryCount < MAX_RETRIES) {
    // Retry: Update retry count and schedule for later
    // Exponential backoff: 5min, 15min, 45min
    const backoffMinutes = Math.pow(3, retryCount) * 5;
    const nextSendAt = new Date();
    nextSendAt.setMinutes(nextSendAt.getMinutes() + backoffMinutes);

    await updateDoc(doc(db, "email_queue", email.id), {
      retryCount,
      error: errorMessage,
      sendAt: Timestamp.fromDate(nextSendAt),
      // Keep status as "pending" for retry
    });

    results.retried++;
  } else {
    // Max retries reached - mark as failed
    await updateDoc(doc(db, "email_queue", email.id), {
      status: "failed",
      error: errorMessage,
      retryCount,
    });

    // Log failed email
    await logEmail(
      email.userId,
      email.to,
      email.subject,
      email.templateName || "Email Template",
      (email.event as any) || "CLIENT_CREATED",
      "failed",
      errorMessage
    );

    results.failed++;
  }
}

/**
 * Health check endpoint
 * GET /api/email/process-queue?health=true
 */
export async function POST(request: NextRequest) {
  // Allow POST for manual triggering (with optional auth)
  return GET(request);
}


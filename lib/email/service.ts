import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, query, where, doc, getDoc } from "firebase/firestore";
import { EmailTemplate, EmailQueueItem, EmailLog, EmailEvent } from "./types";
import { replaceVariables } from "./templates";
import type { InvoiceData } from "@/components/InvoiceGenerator";

export async function getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
  const q = query(collection(db, "email_templates"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as EmailTemplate[];
}

export async function getEmailSettings(userId: string) {
  const settingsDoc = await getDoc(doc(db, "email_settings", userId));
  if (!settingsDoc.exists()) {
    return null;
  }
  return settingsDoc.data();
}

export async function queueEmail(
  userId: string,
  to: string,
  subject: string,
  body: string,
  replyTo: string,
  fromName: string,
  sendAt: Date = new Date(),
  templateName?: string,
  event?: string
): Promise<string> {
  const { Timestamp } = await import("firebase/firestore");
  
  const queueItem: Omit<EmailQueueItem, "id"> = {
    userId,
    to,
    subject,
    body,
    replyTo,
    fromName,
    status: "pending",
    sendAt,
    retryCount: 0,
    createdAt: new Date(),
    // Store additional metadata for logging
    templateName: templateName || "",
    event: event || "",
    emailType: "template",
  };

  const docRef = await addDoc(collection(db, "email_queue"), {
    ...queueItem,
    sendAt: Timestamp.fromDate(sendAt),
    createdAt: Timestamp.fromDate(queueItem.createdAt),
  });
  return docRef.id;
}

/**
 * Queue invoice email with PDF attachment
 * The PDF will be generated when the email is processed from the queue
 */
export async function queueInvoiceEmailWithPDF(
  userId: string,
  invoiceData: InvoiceData,
  userProfile: any,
  recipientEmail: string,
  emailSubject?: string,
  emailBody?: string,
  sendAt?: Date
): Promise<string> {
  const { Timestamp } = await import("firebase/firestore");
  const settings = await getEmailSettings(userId);
  if (!settings || !settings.enabled) {
    throw new Error("Email automation not enabled");
  }

      // Send immediately (no delay)
      const scheduledSendAt = sendAt || new Date();

  const subject = emailSubject || `Invoice ${invoiceData.invoiceNumber} from ${settings.fromName}`;
  const body = emailBody || `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7e22ce;">Invoice ${invoiceData.invoiceNumber}</h2>
      <p>Hi ${invoiceData.client.name},</p>
      <p>Please find attached the invoice for your project <strong>${invoiceData.project.name}</strong>.</p>
      <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}<br>
      <strong>Amount:</strong> ₹${invoiceData.totalAmount.toLocaleString()}<br>
      <strong>Date:</strong> ${new Date(invoiceData.invoiceDate).toLocaleDateString()}</p>
      <p>Please review the attached PDF invoice and let us know if you have any questions.</p>
      <p>Best regards,<br>${settings.fromName}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 12px; color: #6b7280;">This is a transactional email from ${settings.fromName}</p>
    </div>
  `;

  // Serialize invoiceData: convert Date objects to ISO strings for Firestore storage
  // This ensures compatibility with Firestore and easy deserialization
  const serializeInvoiceData = (data: any): any => {
    return JSON.parse(JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
  };

  const queueItem: any = {
    userId,
    to: recipientEmail,
    subject,
    body,
    replyTo: settings.replyTo,
    fromName: settings.fromName,
    status: "pending",
    sendAt: scheduledSendAt,
    retryCount: 0,
    createdAt: new Date(),
    templateName: "Invoice PDF",
    event: "INVOICE_CREATED",
    emailType: "invoice",
    invoiceData: serializeInvoiceData(invoiceData), // Store invoice data for PDF generation (Dates as ISO strings)
    userProfile: userProfile, // Store user profile for PDF generation
  };

  const docRef = await addDoc(collection(db, "email_queue"), {
    ...queueItem,
    sendAt: Timestamp.fromDate(scheduledSendAt),
    createdAt: Timestamp.fromDate(queueItem.createdAt),
  });
  return docRef.id;
}

export async function logEmail(
  userId: string,
  to: string,
  subject: string,
  templateName: string,
  event: EmailEvent,
  status: "sent" | "failed",
  error?: string
): Promise<void> {
  const log: Omit<EmailLog, "id"> = {
    userId,
    to,
    subject,
    templateName,
    event,
    status,
    sentAt: new Date(),
    error,
  };

  await addDoc(collection(db, "email_logs"), log);
}

export function prepareEmailContent(
  template: EmailTemplate,
  variables: Record<string, string>
): { subject: string; body: string } {
  return {
    subject: replaceVariables(template.subject, variables),
    body: replaceVariables(template.body, variables),
  };
}

// Event trigger function - call this from your app when events occur
export async function triggerEmailEvent(
  userId: string,
  event: EmailEvent,
  variables: Record<string, string>,
  recipientEmail: string
): Promise<void> {
  try {
    // Get automation rules for this event
    const rulesSnapshot = await getDocs(
      query(
        collection(db, "automation_rules"),
        where("userId", "==", userId),
        where("event", "==", event),
        where("enabled", "==", true)
      )
    );

    if (rulesSnapshot.empty) return;

    // Get email settings
    const settings = await getEmailSettings(userId);
    if (!settings || !settings.enabled) return;

    // Get templates from dashboard (email automation templates)
    const templates = await getEmailTemplates(userId);

    for (const ruleDoc of rulesSnapshot.docs) {
      const rule = ruleDoc.data();
      const template = templates.find((t) => t.id === rule.templateId);
      if (!template) continue;

      // Prepare email content using template from dashboard
      const { subject, body } = prepareEmailContent(template, variables);

      // Calculate send time (instant sending)
      const ruleDelay = rule.delay || 0;
      const delaySeconds = ruleDelay > 0 ? ruleDelay * 60 : 0; // Convert minutes to seconds, 0 for instant
      const sendAt = new Date(); // Send immediately

      // Always queue emails with a delay (1-2 minutes) to ensure reliable delivery
      await queueEmail(
        userId,
        recipientEmail,
        subject,
        body,
        settings.replyTo,
        settings.fromName,
        sendAt,
        template.name,
        event
      );
      
      console.log(`Email queued for event ${event} to ${recipientEmail}, will be sent immediately`);
    }
  } catch (error) {
    console.error("Error triggering email event:", error);
  }
}

/**
 * Send invoice email with PDF attachment
 * 
 * This function generates a PDF from invoice data and sends it as an email attachment
 * Uses the default "classic" invoice template
 * 
 * @param userId User ID
 * @param invoiceData Invoice data to generate PDF from
 * @param userProfile User profile data
 * @param recipientEmail Recipient email address
 * @param emailSubject Email subject (optional, will use default if not provided)
 * @param emailBody Email body HTML (optional, will use default if not provided)
 */
export async function sendInvoiceEmailWithPDF(
  userId: string,
  invoiceData: InvoiceData,
  userProfile: any,
  recipientEmail: string,
  emailSubject?: string,
  emailBody?: string
): Promise<void> {
  try {
    // Queue the invoice email instead of sending immediately
    // The PDF will be generated when the email is processed from the queue
    await queueInvoiceEmailWithPDF(
      userId,
      invoiceData,
      userProfile,
      recipientEmail,
      emailSubject,
      emailBody
    );
    console.log(`Invoice email queued for ${recipientEmail}`);
  } catch (error) {
    console.error("Error queueing invoice email with PDF:", error);
  }
}

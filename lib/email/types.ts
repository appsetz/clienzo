export type EmailEvent =
  | "CLIENT_CREATED"
  | "PROJECT_STARTED"
  | "PROJECT_COMPLETED"
  | "PROJECT_ON_HOLD"
  | "INVOICE_CREATED"
  | "INVOICE_OVERDUE"
  | "PAYMENT_RECEIVED";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML
  event: EmailEvent;
  variables: string[]; // Available variables like {{client_name}}, {{project_name}}, etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationRule {
  id: string;
  event: EmailEvent;
  templateId: string;
  delay: number; // minutes
  enabled: boolean;
  createdAt: Date;
}

export interface EmailQueueItem {
  id: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  replyTo: string;
  fromName: string;
  status: "pending" | "sent" | "failed";
  sendAt: Date;
  sentAt?: Date;
  retryCount: number;
  error?: string;
  createdAt: Date;
  messageId?: string; // SES message ID
  templateName?: string; // For logging
  event?: string; // For logging
  invoiceData?: any; // Invoice data for PDF generation (when emailType is "invoice")
  emailType?: "template" | "invoice"; // Type of email: template-based or invoice with PDF
  userProfile?: any; // User profile for PDF generation
}

export interface EmailLog {
  id: string;
  userId: string;
  to: string;
  subject: string;
  templateName: string;
  event: EmailEvent;
  status: "sent" | "failed";
  sentAt: Date;
  error?: string;
}


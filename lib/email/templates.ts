import { EmailTemplate, EmailEvent } from "./types";

export const defaultTemplates: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Welcome Email",
    subject: "Welcome to {{agency_name}}!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7e22ce;">Welcome, {{client_name}}!</h2>
        <p>We're excited to have you as a client. Our team is ready to help you achieve your goals.</p>
        <p>If you have any questions, feel free to reach out to us.</p>
        <p>Best regards,<br>{{agency_name}}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is a transactional email from {{agency_name}}</p>
      </div>
    `,
    event: "CLIENT_CREATED",
    variables: ["agency_name", "client_name"],
  },
  {
    name: "Project Started",
    subject: "Project {{project_name}} has started",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7e22ce;">Project Started</h2>
        <p>Hi {{client_name}},</p>
        <p>We're excited to inform you that your project <strong>{{project_name}}</strong> has officially started!</p>
        <p>Our team is now working on delivering the best results for you.</p>
        <p>We'll keep you updated on the progress.</p>
        <p>Best regards,<br>{{agency_name}}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is a transactional email from {{agency_name}}</p>
      </div>
    `,
    event: "PROJECT_STARTED",
    variables: ["agency_name", "client_name", "project_name"],
  },
  {
    name: "Project Completed",
    subject: "Project {{project_name}} completed successfully!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7e22ce;">Project Completed!</h2>
        <p>Hi {{client_name}},</p>
        <p>Great news! Your project <strong>{{project_name}}</strong> has been completed successfully.</p>
        <p>We hope you're happy with the results. If you need any adjustments or have questions, please don't hesitate to reach out.</p>
        <p>Thank you for working with us!</p>
        <p>Best regards,<br>{{agency_name}}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is a transactional email from {{agency_name}}</p>
      </div>
    `,
    event: "PROJECT_COMPLETED",
    variables: ["agency_name", "client_name", "project_name"],
  },
  {
    name: "Project On Hold",
    subject: "Project {{project_name}} is on hold",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Project On Hold</h2>
        <p>Hi {{client_name}},</p>
        <p>We wanted to inform you that your project <strong>{{project_name}}</strong> has been temporarily put on hold.</p>
        <p>We'll resume work as soon as possible. If you have any questions or concerns, please feel free to reach out to us.</p>
        <p>We'll keep you updated on any changes to the project status.</p>
        <p>Best regards,<br>{{agency_name}}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is a transactional email from {{agency_name}}</p>
      </div>
    `,
    event: "PROJECT_ON_HOLD",
    variables: ["agency_name", "client_name", "project_name"],
  },
  {
    name: "Invoice Created",
    subject: "Invoice #{{invoice_number}} from {{agency_name}}",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7e22ce;">New Invoice</h2>
        <p>Hi {{client_name}},</p>
        <p>We've created an invoice for your project <strong>{{project_name}}</strong>.</p>
        <p><strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Amount:</strong> ₹{{invoice_amount}}<br>
        <strong>Due Date:</strong> {{due_date}}</p>
        <p>Please review and let us know if you have any questions.</p>
        <p>Best regards,<br>{{agency_name}}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is a transactional email from {{agency_name}}</p>
      </div>
    `,
    event: "INVOICE_CREATED",
    variables: ["agency_name", "client_name", "project_name", "invoice_number", "invoice_amount", "due_date"],
  },
  {
    name: "Invoice Overdue Reminder",
    subject: "Reminder: Invoice #{{invoice_number}} is overdue",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment Reminder</h2>
        <p>Hi {{client_name}},</p>
        <p>This is a friendly reminder that invoice #{{invoice_number}} for project <strong>{{project_name}}</strong> is now overdue.</p>
        <p><strong>Amount Due:</strong> ₹{{invoice_amount}}<br>
        <strong>Due Date:</strong> {{due_date}}</p>
        <p>Please process the payment at your earliest convenience. If you've already paid, please ignore this email.</p>
        <p>Best regards,<br>{{agency_name}}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is a transactional email from {{agency_name}}</p>
      </div>
    `,
    event: "INVOICE_OVERDUE",
    variables: ["agency_name", "client_name", "project_name", "invoice_number", "invoice_amount", "due_date"],
  },
  {
    name: "Payment Received",
    subject: "Payment received - Thank you!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Payment Received</h2>
        <p>Hi {{client_name}},</p>
        <p>Thank you! We've received your payment of ₹{{payment_amount}}.</p>
        <p>Our team will send you an invoice shortly.</p>
        <p>Your payment has been processed successfully. We appreciate your business!</p>
        <p>Best regards,<br>{{agency_name}}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is a transactional email from {{agency_name}}</p>
      </div>
    `,
    event: "PAYMENT_RECEIVED",
    variables: ["agency_name", "client_name", "payment_amount"],
  },
];

export function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  });
  return result;
}


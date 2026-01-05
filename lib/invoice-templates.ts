import { format } from "date-fns";
import type { InvoiceData } from "@/components/InvoiceGenerator";

export type InvoiceTemplate = "classic" | "minimal" | "professional" | "elegant";

export interface TemplateInfo {
  id: InvoiceTemplate;
  name: string;
  description: string;
  preview: string;
}

export const invoiceTemplates: TemplateInfo[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional invoice layout with clear sections",
    preview: "Traditional design with structured layout",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple design, perfect for modern businesses",
    preview: "Clean lines and minimal styling",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Bold and professional with strong visual hierarchy",
    preview: "Bold headers and professional styling",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated design with gradient accents",
    preview: "Elegant colors and refined typography",
  },
];

export function generateInvoiceHTML(
  invoiceData: InvoiceData,
  userProfile: any,
  template: InvoiceTemplate = "classic"
): string {
  switch (template) {
    case "minimal":
      return generateMinimalTemplate(invoiceData, userProfile);
    case "professional":
      return generateProfessionalTemplate(invoiceData, userProfile);
    case "elegant":
      return generateElegantTemplate(invoiceData, userProfile);
    default:
      return generateClassicTemplate(invoiceData, userProfile);
  }
}

function generateClassicTemplate(invoiceData: InvoiceData, userProfile?: any): string {
  const itemsHTML = invoiceData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          item.date ? format(item.date, "MMM dd, yyyy") : "-"
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          item.paymentType ? item.paymentType : "-"
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.amount.toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d1d5db; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .company-info { text-align: right; }
          .company-name { font-size: 20px; font-weight: 600; margin-bottom: 10px; }
          .bill-to { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .section-title { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f9fafb; padding: 12px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals-table { width: 320px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .total-final { border-top: 2px solid #d1d5db; padding-top: 12px; font-weight: bold; font-size: 16px; }
          .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          @media print { body { margin: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div style="font-size: 14px; color: #6b7280;">Invoice #: ${invoiceData.invoiceNumber}</div>
            <div style="font-size: 14px; color: #6b7280;">Date: ${format(invoiceData.invoiceDate, "MMM dd, yyyy")}</div>
          </div>
          <div class="company-info">
            <div class="company-name">${
              userProfile?.userType === "agency"
                ? userProfile?.agencyName || userProfile?.name || "Your Company"
                : userProfile?.name || "Your Name"
            }</div>
            ${
              userProfile?.userType === "agency"
                ? `
                  ${userProfile?.agencyAddress ? `<div style="font-size: 14px; color: #6b7280;">${userProfile.agencyAddress}</div>` : ""}
                  ${userProfile?.agencyEmail ? `<div style="font-size: 14px; color: #6b7280;">${userProfile.agencyEmail}</div>` : ""}
                  ${userProfile?.agencyPhone ? `<div style="font-size: 14px; color: #6b7280;">${userProfile.agencyPhone}</div>` : ""}
                  ${userProfile?.agencyWebsite ? `<div style="font-size: 14px; color: #6b7280;">${userProfile.agencyWebsite}</div>` : ""}
                `
                : `
                  ${userProfile?.location ? `<div style="font-size: 14px; color: #6b7280;">${userProfile.location}</div>` : ""}
                  ${userProfile?.email ? `<div style="font-size: 14px; color: #6b7280;">${userProfile.email}</div>` : ""}
                  ${userProfile?.phone ? `<div style="font-size: 14px; color: #6b7280;">${userProfile.phone}</div>` : ""}
                `
            }
            ${userProfile?.gstin ? `<div style="font-size: 14px; color: #6b7280; margin-top: 8px;">GSTIN: ${userProfile.gstin}</div>` : ""}
          </div>
        </div>
        <div class="bill-to">
          <div>
            <div class="section-title">Bill To:</div>
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 4px;">${invoiceData.client.name}</div>
            ${invoiceData.client.email ? `<div style="font-size: 14px; color: #6b7280;">${invoiceData.client.email}</div>` : ""}
            ${invoiceData.client.phone ? `<div style="font-size: 14px; color: #6b7280;">${invoiceData.client.phone}</div>` : ""}
          </div>
          <div>
            <div class="section-title">Project:</div>
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 4px;">${invoiceData.project.name}</div>
            <div style="font-size: 14px; color: #6b7280;">Status: ${invoiceData.project.status}</div>
            ${invoiceData.project.deadline ? `<div style="font-size: 14px; color: #6b7280;">Deadline: ${format(invoiceData.project.deadline, "MMM dd, yyyy")}</div>` : ""}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th>Type</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div class="totals">
          <div class="totals-table">
            <div class="totals-row">
              <span>Project Total Amount:</span>
              <span style="font-weight: 600;">₹${invoiceData.totalAmount.toLocaleString()}</span>
            </div>
            <div class="totals-row">
              <span>Total Paid Amount:</span>
              <span style="font-weight: 600; color: #059669;">₹${invoiceData.paidAmount.toLocaleString()}</span>
            </div>
            <div class="totals-row total-final">
              <span>Remaining Amount:</span>
              <span style="color: #ea580c;">₹${invoiceData.pendingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        ${invoiceData.notes ? `<div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;"><div class="section-title">Notes:</div><div style="font-size: 14px; color: #6b7280;">${invoiceData.notes}</div></div>` : ""}
        <div class="footer">
          <div>Thank you for your business!</div>
          <div style="margin-top: 8px;">Generated by Clienova - Client Management System</div>
        </div>
      </body>
    </html>
  `;
}

function generateMinimalTemplate(invoiceData: InvoiceData, userProfile?: any): string {
  const itemsHTML = invoiceData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6;">${item.description}</td>
        <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af;">${
          item.date ? format(item.date, "MMM dd, yyyy") : "-"
        }</td>
        <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af;">${
          item.paymentType ? item.paymentType : "-"
        }</td>
        <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">₹${item.amount.toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 60px; color: #1f2937; background: #ffffff; }
          .header { margin-bottom: 50px; }
          .invoice-title { font-size: 24px; font-weight: 300; letter-spacing: 2px; margin-bottom: 8px; color: #111827; }
          .invoice-number { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .company-info { text-align: right; margin-top: 30px; }
          .company-name { font-size: 18px; font-weight: 500; margin-bottom: 8px; }
          .company-detail { font-size: 12px; color: #6b7280; line-height: 1.6; }
          .bill-to { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 50px; }
          .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 12px; }
          .section-content { font-size: 14px; line-height: 1.8; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { padding: 12px 0; text-align: left; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; border-bottom: 1px solid #f3f4f6; }
          td { padding: 16px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
          .totals-table { width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
          .total-final { border-top: 2px solid #1f2937; padding-top: 16px; margin-top: 8px; font-weight: 600; font-size: 16px; }
          .footer { border-top: 1px solid #f3f4f6; padding-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; }
          @media print { body { margin: 40px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">#${invoiceData.invoiceNumber} • ${format(invoiceData.invoiceDate, "MMM dd, yyyy")}</div>
          <div class="company-info">
            <div class="company-name">${
              userProfile?.userType === "agency"
                ? userProfile?.agencyName || userProfile?.name || "Your Company"
                : userProfile?.name || "Your Name"
            }</div>
            <div class="company-detail">
              ${
                userProfile?.userType === "agency"
                  ? `
                    ${userProfile?.agencyAddress || ""}
                    ${userProfile?.agencyEmail ? `<br>${userProfile.agencyEmail}` : ""}
                    ${userProfile?.agencyPhone ? `<br>${userProfile.agencyPhone}` : ""}
                    ${userProfile?.agencyWebsite ? `<br>${userProfile.agencyWebsite}` : ""}
                  `
                  : `
                    ${userProfile?.location || ""}
                    ${userProfile?.email ? `<br>${userProfile.email}` : ""}
                    ${userProfile?.phone ? `<br>${userProfile.phone}` : ""}
                  `
              }
              ${userProfile?.gstin ? `<br>GSTIN: ${userProfile.gstin}` : ""}
            </div>
          </div>
        </div>
        <div class="bill-to">
          <div>
            <div class="section-title">Bill To</div>
            <div class="section-content">
              <strong>${invoiceData.client.name}</strong><br>
              ${invoiceData.client.email || ""}
              ${invoiceData.client.phone ? `<br>${invoiceData.client.phone}` : ""}
            </div>
          </div>
          <div>
            <div class="section-title">Project</div>
            <div class="section-content">
              <strong>${invoiceData.project.name}</strong><br>
              Status: ${invoiceData.project.status}
              ${invoiceData.project.deadline ? `<br>Deadline: ${format(invoiceData.project.deadline, "MMM dd, yyyy")}` : ""}
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th>Type</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div class="totals">
          <div class="totals-table">
            <div class="totals-row">
              <span>Project Total:</span>
              <span>₹${invoiceData.totalAmount.toLocaleString()}</span>
            </div>
            <div class="totals-row">
              <span>Paid:</span>
              <span>₹${invoiceData.paidAmount.toLocaleString()}</span>
            </div>
            <div class="totals-row total-final">
              <span>Remaining:</span>
              <span>₹${invoiceData.pendingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        ${invoiceData.notes ? `<div style="border-top: 1px solid #f3f4f6; padding-top: 30px; margin-top: 30px;"><div class="section-title">Notes</div><div class="section-content">${invoiceData.notes}</div></div>` : ""}
        <div class="footer">Thank you for your business</div>
      </body>
    </html>
  `;
}

function generateProfessionalTemplate(invoiceData: InvoiceData, userProfile?: any): string {
  const itemsHTML = invoiceData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px; border-bottom: 2px solid #e5e7eb; background: #ffffff;">${item.description}</td>
        <td style="padding: 14px; border-bottom: 2px solid #e5e7eb; background: #ffffff;">${
          item.date ? format(item.date, "MMM dd, yyyy") : "-"
        }</td>
        <td style="padding: 14px; border-bottom: 2px solid #e5e7eb; background: #ffffff;">${
          item.paymentType ? item.paymentType.toUpperCase() : "-"
        }</td>
        <td style="padding: 14px; border-bottom: 2px solid #e5e7eb; background: #ffffff; text-align: right; font-weight: 600;">₹${item.amount.toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; margin: 30px; color: #0f172a; background: #f8fafc; }
          .container { background: #ffffff; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { border-bottom: 4px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-title { font-size: 42px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
          .invoice-meta { font-size: 14px; color: #475569; margin-top: 8px; }
          .company-info { text-align: right; margin-top: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
          .company-detail { font-size: 13px; color: #475569; line-height: 1.8; }
          .bill-to { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 35px; padding: 20px; background: #f1f5f9; }
          .section-title { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 12px; text-transform: uppercase; }
          .section-content { font-size: 14px; line-height: 1.8; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 2px solid #1e293b; }
          th { background: #1e293b; color: #ffffff; padding: 16px; text-align: left; font-weight: bold; font-size: 13px; text-transform: uppercase; }
          td { padding: 14px; border-bottom: 2px solid #e5e7eb; background: #ffffff; font-size: 14px; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals-table { width: 350px; background: #f1f5f9; padding: 20px; border: 2px solid #1e293b; }
          .totals-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 15px; font-weight: 500; }
          .total-final { border-top: 3px solid #1e293b; padding-top: 16px; margin-top: 8px; font-weight: bold; font-size: 18px; color: #1e293b; }
          .footer { border-top: 3px solid #1e293b; padding-top: 25px; text-align: center; font-size: 13px; color: #475569; font-weight: 500; }
          @media print { body { margin: 0; background: #fff; } .container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">Invoice #: ${invoiceData.invoiceNumber} | Date: ${format(invoiceData.invoiceDate, "MMM dd, yyyy")}</div>
            <div class="company-info">
              <div class="company-name">${
                userProfile?.userType === "agency"
                  ? userProfile?.agencyName || userProfile?.name || "Your Company"
                  : userProfile?.name || "Your Name"
              }</div>
              <div class="company-detail">
                ${
                  userProfile?.userType === "agency"
                    ? `
                      ${userProfile?.agencyAddress || ""}
                      ${userProfile?.agencyEmail ? `<br>${userProfile.agencyEmail}` : ""}
                      ${userProfile?.agencyPhone ? `<br>${userProfile.agencyPhone}` : ""}
                      ${userProfile?.agencyWebsite ? `<br>${userProfile.agencyWebsite}` : ""}
                    `
                    : `
                      ${userProfile?.location || ""}
                      ${userProfile?.email ? `<br>${userProfile.email}` : ""}
                      ${userProfile?.phone ? `<br>${userProfile.phone}` : ""}
                    `
                }
                ${userProfile?.gstin ? `<br><strong>GSTIN:</strong> ${userProfile.gstin}` : ""}
              </div>
            </div>
          </div>
          <div class="bill-to">
            <div>
              <div class="section-title">Bill To</div>
              <div class="section-content">
                <strong>${invoiceData.client.name}</strong><br>
                ${invoiceData.client.email || ""}
                ${invoiceData.client.phone ? `<br>${invoiceData.client.phone}` : ""}
              </div>
            </div>
            <div>
              <div class="section-title">Project Details</div>
              <div class="section-content">
                <strong>${invoiceData.project.name}</strong><br>
                Status: ${invoiceData.project.status}
                ${invoiceData.project.deadline ? `<br>Deadline: ${format(invoiceData.project.deadline, "MMM dd, yyyy")}` : ""}
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Date</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
          <div class="totals">
            <div class="totals-table">
              <div class="totals-row">
                <span>Project Total Amount:</span>
                <span>₹${invoiceData.totalAmount.toLocaleString()}</span>
              </div>
              <div class="totals-row">
                <span>Total Paid Amount:</span>
                <span style="color: #059669;">₹${invoiceData.paidAmount.toLocaleString()}</span>
              </div>
              <div class="totals-row total-final">
                <span>Remaining Amount:</span>
                <span style="color: #dc2626;">₹${invoiceData.pendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          ${invoiceData.notes ? `<div style="border-top: 2px solid #1e293b; padding-top: 20px; margin-top: 30px;"><div class="section-title">Notes</div><div class="section-content">${invoiceData.notes}</div></div>` : ""}
          <div class="footer">
            <div style="font-size: 16px; margin-bottom: 8px;">Thank you for your business!</div>
            <div>Generated by Clienova - Client Management System</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateElegantTemplate(invoiceData: InvoiceData, userProfile?: any): string {
  const itemsHTML = invoiceData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px; border-bottom: 1px solid #e9d5ff;">${item.description}</td>
        <td style="padding: 14px; border-bottom: 1px solid #e9d5ff; color: #7c3aed;">${
          item.date ? format(item.date, "MMM dd, yyyy") : "-"
        }</td>
        <td style="padding: 14px; border-bottom: 1px solid #e9d5ff; color: #7c3aed;">${
          item.paymentType ? item.paymentType : "-"
        }</td>
        <td style="padding: 14px; border-bottom: 1px solid #e9d5ff; text-align: right; font-weight: 600; color: #7c3aed;">₹${item.amount.toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: 'Playfair Display', 'Georgia', serif; margin: 0; color: #1f2937; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; }
          .container { background: #ffffff; padding: 50px; max-width: 900px; margin: 0 auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: -50px -50px 40px -50px; }
          .invoice-title { font-size: 48px; font-weight: 700; margin-bottom: 10px; letter-spacing: 2px; }
          .invoice-meta { font-size: 14px; opacity: 0.9; margin-top: 8px; }
          .company-info { text-align: right; margin-top: 25px; }
          .company-name { font-size: 22px; font-weight: 600; margin-bottom: 10px; }
          .company-detail { font-size: 13px; opacity: 0.9; line-height: 1.8; }
          .bill-to { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 8px; }
          .section-title { font-size: 14px; font-weight: 600; color: #7c3aed; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .section-content { font-size: 14px; line-height: 1.8; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
          th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
          td { padding: 14px; border-bottom: 1px solid #e9d5ff; font-size: 14px; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 35px; }
          .totals-table { width: 320px; background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); padding: 25px; border-radius: 8px; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; }
          .total-final { border-top: 2px solid #7c3aed; padding-top: 16px; margin-top: 8px; font-weight: bold; font-size: 18px; color: #7c3aed; }
          .footer { border-top: 2px solid #e9d5ff; padding-top: 30px; text-align: center; font-size: 13px; color: #7c3aed; font-style: italic; }
          @media print { body { background: #fff; padding: 0; } .container { box-shadow: none; } .header { margin: 0 0 40px 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">Invoice #: ${invoiceData.invoiceNumber} | Date: ${format(invoiceData.invoiceDate, "MMM dd, yyyy")}</div>
            <div class="company-info">
              <div class="company-name">${
                userProfile?.userType === "agency"
                  ? userProfile?.agencyName || userProfile?.name || "Your Company"
                  : userProfile?.name || "Your Name"
              }</div>
              <div class="company-detail">
                ${
                  userProfile?.userType === "agency"
                    ? `
                      ${userProfile?.agencyAddress || ""}
                      ${userProfile?.agencyEmail ? `<br>${userProfile.agencyEmail}` : ""}
                      ${userProfile?.agencyPhone ? `<br>${userProfile.agencyPhone}` : ""}
                      ${userProfile?.agencyWebsite ? `<br>${userProfile.agencyWebsite}` : ""}
                    `
                    : `
                      ${userProfile?.location || ""}
                      ${userProfile?.email ? `<br>${userProfile.email}` : ""}
                      ${userProfile?.phone ? `<br>${userProfile.phone}` : ""}
                    `
                }
                ${userProfile?.gstin ? `<br>GSTIN: ${userProfile.gstin}` : ""}
              </div>
            </div>
          </div>
          <div class="bill-to">
            <div>
              <div class="section-title">Bill To</div>
              <div class="section-content">
                <strong style="color: #7c3aed;">${invoiceData.client.name}</strong><br>
                ${invoiceData.client.email || ""}
                ${invoiceData.client.phone ? `<br>${invoiceData.client.phone}` : ""}
              </div>
            </div>
            <div>
              <div class="section-title">Project</div>
              <div class="section-content">
                <strong style="color: #7c3aed;">${invoiceData.project.name}</strong><br>
                Status: ${invoiceData.project.status}
                ${invoiceData.project.deadline ? `<br>Deadline: ${format(invoiceData.project.deadline, "MMM dd, yyyy")}` : ""}
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Date</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
          <div class="totals">
            <div class="totals-table">
              <div class="totals-row">
                <span>Project Total:</span>
                <span>₹${invoiceData.totalAmount.toLocaleString()}</span>
              </div>
              <div class="totals-row">
                <span>Paid:</span>
                <span style="color: #059669;">₹${invoiceData.paidAmount.toLocaleString()}</span>
              </div>
              <div class="totals-row total-final">
                <span>Remaining:</span>
                <span>₹${invoiceData.pendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          ${invoiceData.notes ? `<div style="border-top: 2px solid #e9d5ff; padding-top: 25px; margin-top: 30px;"><div class="section-title">Notes</div><div class="section-content">${invoiceData.notes}</div></div>` : ""}
          <div class="footer">
            <div style="font-size: 16px; margin-bottom: 8px; font-weight: 600;">Thank you for your business!</div>
            <div>Generated by Clienova</div>
          </div>
        </div>
      </body>
    </html>
  `;
}


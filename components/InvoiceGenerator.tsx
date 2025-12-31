"use client";

import { FileText, Download, X } from "lucide-react";
import { format } from "date-fns";
import { Client, Project, Payment } from "@/lib/firebase/db";

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  client: Client;
  project: Project;
  items: {
    description: string;
    amount: number;
    date?: Date;
    paymentType?: string;
  }[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  notes?: string;
}

interface InvoiceGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | null;
  userProfile?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
    userType?: "freelancer" | "agency";
    // Agency fields
    agencyName?: string;
    agencyPhone?: string;
    agencyEmail?: string;
    agencyAddress?: string;
    agencyWebsite?: string;
    agencyDescription?: string;
    // Additional fields
    gstin?: string;
  };
}

export default function InvoiceGenerator({
  isOpen,
  onClose,
  invoiceData,
  userProfile,
}: InvoiceGeneratorProps) {
  if (!isOpen || !invoiceData) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invoiceHTML = generateInvoiceHTML(invoiceData, userProfile);
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadPDF = () => {
    handlePrint(); // For now, use print to PDF functionality
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div id="invoice-content" className="bg-white p-8 border border-gray-200 rounded-lg">
          {renderInvoice(invoiceData, userProfile)}
        </div>
      </div>
    </div>
  );
}

function renderInvoice(invoiceData: InvoiceData, userProfile?: any) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-300 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <p className="text-sm text-gray-600">Invoice #: {invoiceData.invoiceNumber}</p>
          <p className="text-sm text-gray-600">
            Date: {format(invoiceData.invoiceDate, "MMM dd, yyyy")}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-right">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {userProfile?.userType === "agency" 
              ? (userProfile?.agencyName || userProfile?.name || "Your Company")
              : (userProfile?.name || "Your Name")
            }
          </h2>
          {userProfile?.userType === "agency" ? (
            <>
              {userProfile?.agencyAddress && (
                <p className="text-sm text-gray-600 mb-1">{userProfile.agencyAddress}</p>
              )}
              {userProfile?.agencyEmail && (
                <p className="text-sm text-gray-600 mb-1">{userProfile.agencyEmail}</p>
              )}
              {userProfile?.agencyPhone && (
                <p className="text-sm text-gray-600 mb-1">{userProfile.agencyPhone}</p>
              )}
              {userProfile?.agencyWebsite && (
                <p className="text-sm text-gray-600 mb-1">{userProfile.agencyWebsite}</p>
              )}
            </>
          ) : (
            <>
              {userProfile?.location && (
                <p className="text-sm text-gray-600 mb-1">{userProfile.location}</p>
              )}
              {userProfile?.email && (
                <p className="text-sm text-gray-600 mb-1">{userProfile.email}</p>
              )}
              {userProfile?.phone && (
                <p className="text-sm text-gray-600 mb-1">{userProfile.phone}</p>
              )}
            </>
          )}
          {userProfile?.gstin && (
            <p className="text-sm text-gray-600 mt-2">GSTIN: {userProfile.gstin}</p>
          )}
        </div>
      </div>

      {/* Bill To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Bill To:</h3>
          <p className="text-base font-medium text-gray-900">{invoiceData.client.name}</p>
          {invoiceData.client.email && (
            <p className="text-sm text-gray-600">{invoiceData.client.email}</p>
          )}
          {invoiceData.client.phone && (
            <p className="text-sm text-gray-600">{invoiceData.client.phone}</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Project:</h3>
          <p className="text-base font-medium text-gray-900">{invoiceData.project.name}</p>
          <p className="text-sm text-gray-600 capitalize">Status: {invoiceData.project.status}</p>
          {invoiceData.project.deadline && (
            <p className="text-sm text-gray-600">
              Deadline: {format(invoiceData.project.deadline, "MMM dd, yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoiceData.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.date ? format(item.date, "MMM dd, yyyy") : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.paymentType ? (
                    <span className="capitalize">{item.paymentType}</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                  ₹{item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Project Total Amount:</span>
            <span className="font-semibold text-gray-900">₹{invoiceData.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Paid Amount:</span>
            <span className="font-semibold text-green-600">₹{invoiceData.paidAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t-2 border-gray-300 pt-2">
            <span className="text-gray-900">Remaining Amount:</span>
            <span className="text-orange-600">₹{invoiceData.pendingAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoiceData.notes && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h3>
          <p className="text-sm text-gray-600">{invoiceData.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
        <p>Thank you for your business!</p>
        <p className="mt-1">Generated by Clienova - Client Management System</p>
      </div>
    </div>
  );
}

function generateInvoiceHTML(invoiceData: InvoiceData, userProfile?: any): string {
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
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #111827;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #d1d5db;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .company-info {
            text-align: right;
          }
          .company-name {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .bill-to {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals-table {
            width: 320px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .total-final {
            border-top: 2px solid #d1d5db;
            padding-top: 12px;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
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
                ? (userProfile?.agencyName || userProfile?.name || "Your Company")
                : (userProfile?.name || "Your Name")
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
          <tbody>
            ${itemsHTML}
          </tbody>
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
        
        ${invoiceData.notes ? `
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <div class="section-title">Notes:</div>
          <div style="font-size: 14px; color: #6b7280;">${invoiceData.notes}</div>
        </div>
        ` : ""}
        
        <div class="footer">
          <div>Thank you for your business!</div>
          <div style="margin-top: 8px;">Generated by Clienova - Client Management System</div>
        </div>
      </body>
    </html>
  `;
}


"use client";

import { useState } from "react";
import { FileText, Download, X, Palette, Check } from "lucide-react";
import { format } from "date-fns";
import { Client, Project, Payment } from "@/lib/firebase/db";
import { invoiceTemplates, InvoiceTemplate, generateInvoiceHTML } from "@/lib/invoice-templates";

export interface InvoiceData {
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
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>("classic");

  if (!isOpen || !invoiceData) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invoiceHTML = generateInvoiceHTML(invoiceData, userProfile, selectedTemplate);
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
      <div className="bg-white rounded-lg max-w-6xl w-full p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Invoice Generator</h2>
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

        {/* Template Selection - Horizontal */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-gray-600">Choose a template:</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Brand Consistency Tip:</span> Maintain one template for your agency, at least for one client until you finish that project. Consistent branding across invoices helps build trust and professionalism.
              </p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {invoiceTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`flex-shrink-0 w-48 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? "border-purple-500 bg-purple-50 shadow-lg"
                    : "border-gray-200 hover:border-purple-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {selectedTemplate === template.id && (
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                <div className="bg-white rounded border border-gray-200 p-3 h-32 overflow-hidden">
                  {renderTemplatePreview(template.id, invoiceData, userProfile)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Preview: {invoiceTemplates.find(t => t.id === selectedTemplate)?.name} Template
            </h3>
          </div>
          <div id="invoice-content" className="bg-white p-8 border border-gray-200 rounded-lg">
            {renderInvoice(invoiceData, userProfile, selectedTemplate)}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderTemplatePreview(template: InvoiceTemplate, invoiceData: InvoiceData, userProfile?: any) {
  // Create a simplified preview of each template
  const sampleData = {
    invoiceNumber: "INV-001",
    clientName: invoiceData.client.name.length > 15 ? invoiceData.client.name.substring(0, 15) + "..." : invoiceData.client.name,
    projectName: invoiceData.project.name.length > 20 ? invoiceData.project.name.substring(0, 20) + "..." : invoiceData.project.name,
    amount: invoiceData.totalAmount,
  };

  switch (template) {
    case "minimal":
      return (
        <div className="space-y-3 text-xs">
          <div className="border-b border-gray-200 pb-2">
            <div className="text-sm font-light tracking-widest text-gray-900">INVOICE</div>
            <div className="text-gray-400 mt-1">#{sampleData.invoiceNumber}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-400 uppercase text-[10px] mb-1">Bill To</div>
              <div className="font-medium">{sampleData.clientName}</div>
            </div>
            <div>
              <div className="text-gray-400 uppercase text-[10px] mb-1">Project</div>
              <div className="font-medium">{sampleData.projectName}</div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <div className="flex justify-between text-xs">
              <span>Total:</span>
              <span className="font-medium">₹{sampleData.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    case "professional":
      return (
        <div className="space-y-3 text-xs bg-gray-50 p-3 rounded border-2 border-gray-800">
          <div className="border-b-4 border-gray-800 pb-2">
            <div className="text-base font-bold text-gray-900">INVOICE</div>
            <div className="text-gray-600 text-[10px]">#{sampleData.invoiceNumber}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-2 rounded">
            <div>
              <div className="text-[10px] font-bold uppercase text-gray-700 mb-1">Bill To</div>
              <div className="font-semibold text-xs">{sampleData.clientName}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-gray-700 mb-1">Project</div>
              <div className="font-semibold text-xs">{sampleData.projectName}</div>
            </div>
          </div>
          <div className="bg-gray-100 p-2 rounded border-2 border-gray-800">
            <div className="flex justify-between text-xs font-bold">
              <span>Total:</span>
              <span>₹{sampleData.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    case "elegant":
      return (
        <div className="space-y-3 text-xs" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "12px", borderRadius: "6px" }}>
          <div className="bg-white rounded p-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded mb-2 -m-3 mb-2">
              <div className="text-sm font-bold">INVOICE</div>
              <div className="text-[10px] opacity-90">#{sampleData.invoiceNumber}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded">
              <div>
                <div className="text-[10px] font-semibold text-purple-700 uppercase mb-1">Bill To</div>
                <div className="font-semibold text-xs">{sampleData.clientName}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-purple-700 uppercase mb-1">Project</div>
                <div className="font-semibold text-xs">{sampleData.projectName}</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded mt-2">
              <div className="flex justify-between text-xs font-semibold text-purple-700">
                <span>Total:</span>
                <span>₹{sampleData.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      );
    default: // classic
      return (
        <div className="space-y-3 text-xs">
          <div className="border-b-2 border-gray-300 pb-2">
            <div className="text-base font-bold text-gray-900">INVOICE</div>
            <div className="text-gray-500 text-[10px]">#{sampleData.invoiceNumber}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-semibold text-gray-600 mb-1">Bill To:</div>
              <div className="font-medium text-xs">{sampleData.clientName}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-600 mb-1">Project:</div>
              <div className="font-medium text-xs">{sampleData.projectName}</div>
            </div>
          </div>
          <div className="border border-gray-200 rounded p-2">
            <div className="text-[10px] text-gray-500 mb-1">Items</div>
            <div className="h-16 bg-gray-50 rounded"></div>
          </div>
          <div className="flex justify-end">
            <div className="w-32 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>Total:</span>
                <span className="font-semibold">₹{sampleData.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      );
  }
}

function renderInvoice(invoiceData: InvoiceData, userProfile?: any, template: InvoiceTemplate = "classic") {
  // Render different templates based on selection
  switch (template) {
    case "minimal":
      return renderMinimalInvoice(invoiceData, userProfile);
    case "professional":
      return renderProfessionalInvoice(invoiceData, userProfile);
    case "elegant":
      return renderElegantInvoice(invoiceData, userProfile);
    default:
      return renderClassicInvoice(invoiceData, userProfile);
  }
}

function renderClassicInvoice(invoiceData: InvoiceData, userProfile?: any) {
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

function renderMinimalInvoice(invoiceData: InvoiceData, userProfile?: any) {
  return (
    <div className="space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-light tracking-widest text-gray-900 mb-2">INVOICE</h1>
        <p className="text-xs text-gray-500">#{invoiceData.invoiceNumber} • {format(invoiceData.invoiceDate, "MMM dd, yyyy")}</p>
        <div className="text-right mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {userProfile?.userType === "agency" 
              ? (userProfile?.agencyName || userProfile?.name || "Your Company")
              : (userProfile?.name || "Your Name")
            }
          </h2>
          <div className="text-xs text-gray-500 space-y-1">
            {userProfile?.userType === "agency" ? (
              <>
                {userProfile?.agencyAddress && <p>{userProfile.agencyAddress}</p>}
                {userProfile?.agencyEmail && <p>{userProfile.agencyEmail}</p>}
                {userProfile?.agencyPhone && <p>{userProfile.agencyPhone}</p>}
              </>
            ) : (
              <>
                {userProfile?.location && <p>{userProfile.location}</p>}
                {userProfile?.email && <p>{userProfile.email}</p>}
                {userProfile?.phone && <p>{userProfile.phone}</p>}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-12 py-6 bg-gray-50 px-6 rounded">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Bill To</p>
          <p className="font-medium text-gray-900">{invoiceData.client.name}</p>
          {invoiceData.client.email && <p className="text-sm text-gray-600">{invoiceData.client.email}</p>}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Project</p>
          <p className="font-medium text-gray-900">{invoiceData.project.name}</p>
          <p className="text-sm text-gray-600">Status: {invoiceData.project.status}</p>
        </div>
      </div>
      <div className="border-t border-b border-gray-200 py-4">
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-200">
              <th className="text-left pb-3">Description</th>
              <th className="text-left pb-3">Date</th>
              <th className="text-left pb-3">Type</th>
              <th className="text-right pb-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-4 text-sm text-gray-900">{item.description}</td>
                <td className="py-4 text-sm text-gray-500">{item.date ? format(item.date, "MMM dd, yyyy") : "-"}</td>
                <td className="py-4 text-sm text-gray-500">{item.paymentType || "-"}</td>
                <td className="py-4 text-sm text-right font-medium">₹{item.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm py-2">
            <span className="text-gray-600">Project Total:</span>
            <span>₹{invoiceData.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-gray-600">Paid:</span>
            <span className="text-green-600">₹{invoiceData.paidAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-3 border-t-2 border-gray-900">
            <span>Remaining:</span>
            <span>₹{invoiceData.pendingAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
      {invoiceData.notes && (
        <div className="pt-6 border-t border-gray-200">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Notes</p>
          <p className="text-sm text-gray-600">{invoiceData.notes}</p>
        </div>
      )}
      <div className="text-center text-xs text-gray-400 pt-6">Thank you for your business</div>
    </div>
  );
}

function renderProfessionalInvoice(invoiceData: InvoiceData, userProfile?: any) {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg border-2 border-gray-800">
      <div className="bg-white p-6 border-2 border-gray-800">
        <div className="border-b-4 border-gray-800 pb-4 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <p className="text-sm text-gray-600">Invoice #: {invoiceData.invoiceNumber} | Date: {format(invoiceData.invoiceDate, "MMM dd, yyyy")}</p>
        </div>
        <div className="text-right mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {userProfile?.userType === "agency" 
              ? (userProfile?.agencyName || userProfile?.name || "Your Company")
              : (userProfile?.name || "Your Name")
            }
          </h2>
          <div className="text-sm text-gray-700 space-y-1">
            {userProfile?.userType === "agency" ? (
              <>
                {userProfile?.agencyAddress && <p>{userProfile.agencyAddress}</p>}
                {userProfile?.agencyEmail && <p>{userProfile.agencyEmail}</p>}
                {userProfile?.agencyPhone && <p>{userProfile.agencyPhone}</p>}
              </>
            ) : (
              <>
                {userProfile?.location && <p>{userProfile.location}</p>}
                {userProfile?.email && <p>{userProfile.email}</p>}
                {userProfile?.phone && <p>{userProfile.phone}</p>}
              </>
            )}
            {userProfile?.gstin && <p className="font-semibold">GSTIN: {userProfile.gstin}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 bg-gray-100 p-5 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase">Bill To</h3>
            <p className="font-semibold text-gray-900">{invoiceData.client.name}</p>
            {invoiceData.client.email && <p className="text-sm text-gray-700">{invoiceData.client.email}</p>}
            {invoiceData.client.phone && <p className="text-sm text-gray-700">{invoiceData.client.phone}</p>}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase">Project Details</h3>
            <p className="font-semibold text-gray-900">{invoiceData.project.name}</p>
            <p className="text-sm text-gray-700">Status: {invoiceData.project.status}</p>
            {invoiceData.project.deadline && <p className="text-sm text-gray-700">Deadline: {format(invoiceData.project.deadline, "MMM dd, yyyy")}</p>}
          </div>
        </div>
        <div className="border-2 border-gray-800 overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase">Description</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase">Date</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase">Type</th>
                <th className="px-4 py-3 text-right text-sm font-bold uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index} className="bg-white border-b-2 border-gray-800">
                  <td className="px-4 py-3 text-sm font-medium">{item.description}</td>
                  <td className="px-4 py-3 text-sm">{item.date ? format(item.date, "MMM dd, yyyy") : "-"}</td>
                  <td className="px-4 py-3 text-sm uppercase font-medium">{item.paymentType || "-"}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <div className="w-80 bg-gray-100 border-2 border-gray-800 p-5">
            <div className="flex justify-between py-2 text-sm font-semibold">
              <span>Project Total Amount:</span>
              <span>₹{invoiceData.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 text-sm font-semibold">
              <span>Total Paid Amount:</span>
              <span className="text-green-700">₹{invoiceData.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 mt-2 border-t-3 border-gray-800 text-base font-bold">
              <span>Remaining Amount:</span>
              <span className="text-red-700">₹{invoiceData.pendingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        {invoiceData.notes && (
          <div className="mt-6 pt-4 border-t-2 border-gray-800">
            <h3 className="text-base font-bold text-gray-900 mb-2 uppercase">Notes</h3>
            <p className="text-sm text-gray-700">{invoiceData.notes}</p>
          </div>
        )}
        <div className="mt-6 pt-4 border-t-3 border-gray-800 text-center">
          <p className="text-base font-bold mb-1">Thank you for your business!</p>
          <p className="text-xs text-gray-600">Generated by Clienova - Client Management System</p>
        </div>
      </div>
    </div>
  );
}

function renderElegantInvoice(invoiceData: InvoiceData, userProfile?: any) {
  return (
    <div className="space-y-6" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px", borderRadius: "8px" }}>
      <div className="bg-white rounded-lg p-8 shadow-2xl">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 -m-8 mb-6 rounded-t-lg">
          <h1 className="text-5xl font-bold mb-2">INVOICE</h1>
          <p className="text-sm opacity-90">Invoice #: {invoiceData.invoiceNumber} | Date: {format(invoiceData.invoiceDate, "MMM dd, yyyy")}</p>
        </div>
        <div className="text-right mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {userProfile?.userType === "agency" 
              ? (userProfile?.agencyName || userProfile?.name || "Your Company")
              : (userProfile?.name || "Your Name")
            }
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            {userProfile?.userType === "agency" ? (
              <>
                {userProfile?.agencyAddress && <p>{userProfile.agencyAddress}</p>}
                {userProfile?.agencyEmail && <p>{userProfile.agencyEmail}</p>}
                {userProfile?.agencyPhone && <p>{userProfile.agencyPhone}</p>}
              </>
            ) : (
              <>
                {userProfile?.location && <p>{userProfile.location}</p>}
                {userProfile?.email && <p>{userProfile.email}</p>}
                {userProfile?.phone && <p>{userProfile.phone}</p>}
              </>
            )}
            {userProfile?.gstin && <p>GSTIN: {userProfile.gstin}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
          <div>
            <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-3">Bill To</h3>
            <p className="font-semibold text-gray-900 text-lg">{invoiceData.client.name}</p>
            {invoiceData.client.email && <p className="text-sm text-gray-600">{invoiceData.client.email}</p>}
            {invoiceData.client.phone && <p className="text-sm text-gray-600">{invoiceData.client.phone}</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-3">Project</h3>
            <p className="font-semibold text-gray-900 text-lg">{invoiceData.project.name}</p>
            <p className="text-sm text-gray-600">Status: {invoiceData.project.status}</p>
            {invoiceData.project.deadline && <p className="text-sm text-gray-600">Deadline: {format(invoiceData.project.deadline, "MMM dd, yyyy")}</p>}
          </div>
        </div>
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Type</th>
                <th className="px-4 py-3 text-right text-sm font-semibold uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index} className="border-b border-purple-100">
                  <td className="px-4 py-3 text-sm">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-purple-600">{item.date ? format(item.date, "MMM dd, yyyy") : "-"}</td>
                  <td className="px-4 py-3 text-sm text-purple-600">{item.paymentType || "-"}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-purple-600">₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <div className="w-80 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-700">Project Total:</span>
              <span className="font-semibold">₹{invoiceData.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-700">Paid:</span>
              <span className="font-semibold text-green-600">₹{invoiceData.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 mt-2 border-t-2 border-purple-300 text-base font-bold text-purple-700">
              <span>Remaining:</span>
              <span>₹{invoiceData.pendingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        {invoiceData.notes && (
          <div className="mt-6 pt-4 border-t border-purple-200">
            <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{invoiceData.notes}</p>
          </div>
        )}
        <div className="mt-6 pt-4 border-t border-purple-200 text-center">
          <p className="text-base font-semibold text-purple-700 mb-1 italic">Thank you for your business!</p>
          <p className="text-xs text-purple-500">Generated by Clienova</p>
        </div>
      </div>
    </div>
  );
}

// Note: generateInvoiceHTML is imported from lib/invoice-templates.ts
// This legacy function is kept for reference but not used
function generateInvoiceHTMLLegacy(invoiceData: InvoiceData, userProfile?: any): string {
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


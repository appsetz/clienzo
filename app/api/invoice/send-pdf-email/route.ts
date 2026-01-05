import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmailWithPDF } from "@/lib/email/service";
import type { InvoiceData } from "@/components/InvoiceGenerator";

/**
 * API Route to send invoice email with PDF attachment
 * POST /api/invoice/send-pdf-email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, invoiceData, userProfile, recipientEmail, emailSubject, emailBody } = body;

    if (!userId || !invoiceData || !userProfile || !recipientEmail) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, invoiceData, userProfile, recipientEmail" },
        { status: 400 }
      );
    }

    await sendInvoiceEmailWithPDF(
      userId,
      invoiceData,
      userProfile,
      recipientEmail,
      emailSubject,
      emailBody
    );

    return NextResponse.json({
      success: true,
      message: "Invoice email with PDF queued successfully",
    });
  } catch (error: any) {
    console.error("Error sending invoice PDF email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send invoice email" },
      { status: 500 }
    );
  }
}


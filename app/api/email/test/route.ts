/**
 * Email Test Endpoint
 * 
 * Use this endpoint to test if email service is properly configured and can send emails.
 * GET /api/email/test?to=your-email@example.com
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendEmail, isEmailConfigured } from "@/lib/email/sender";

export async function GET(request: NextRequest) {
  try {
    // Check if email service is configured
    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured. Please configure your email provider in lib/email/sender.ts",
        },
        { status: 400 }
      );
    }

    // Get test email from query params
    const searchParams = request.nextUrl.searchParams;
    const testEmail = searchParams.get("to");

    if (!testEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a 'to' parameter with an email address",
          example: "/api/email/test?to=your-email@example.com",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address format",
        },
        { status: 400 }
      );
    }

    // Send test email
    const result = await sendEmail({
      to: testEmail,
      subject: "Test Email from Clienova",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7e22ce;">✅ Email Test Successful!</h2>
          <p>This is a test email from Clienova's email automation system (powered by Resend).</p>
          <p>If you received this email, your email provider setup is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">
            Sent via: support@clienova.com<br>
            Reply-To: test@clienova.com
          </p>
        </div>
      `,
      textBody: "Test Email from Clienova\n\nThis is a test email. If you received this, your email provider setup is working correctly!",
      agencyName: "Test Agency",
      replyToEmail: "test@clienova.com",
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully!",
        messageId: result.messageId,
        to: testEmail,
        note: "Check your inbox (and spam folder) for the test email.",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send test email",
          messageId: result.messageId,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unexpected error occurred",
        details: error.name || "Unknown error",
      },
      { status: 500 }
    );
  }
}

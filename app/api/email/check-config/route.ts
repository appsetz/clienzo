/**
 * Configuration Check Endpoint
 * 
 * Check if email service is properly configured.
 * GET /api/email/check-config
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isEmailConfigured } from "@/lib/email/sender";

export async function GET() {
  const configured = isEmailConfigured();
  
  const config = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "✅ Set" : "❌ Missing",
  };

  return NextResponse.json({
    configured,
    status: configured ? "Ready" : "Not Configured",
    configuration: config,
    message: configured
      ? "Email service is configured and ready"
      : "Email service not configured. Please set RESEND_API_KEY environment variable.",
    nextSteps: configured
      ? [
          "1. Test email sending: GET /api/email/test?to=your-email@example.com",
          "2. Set up cron job to process email queue",
        ]
      : [
          "1. Add RESEND_API_KEY to .env.local",
          "2. Restart your development server",
          "3. Test email sending: GET /api/email/test?to=your-email@example.com",
        ],
  });
}

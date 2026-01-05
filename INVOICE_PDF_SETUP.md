# Invoice PDF Email Setup Guide

## Overview

The system now sends invoices as PDF attachments via email when payments are added. PDFs are generated using the default "classic" invoice template.

## Required Dependencies

For serverless environments (like Vercel), install these packages:

```bash
npm install puppeteer-core @sparticuz/chromium
```

For other Node.js environments, you can use:
```bash
npm install puppeteer-core puppeteer
```

**Note:** `@sparticuz/chromium` is specifically designed for serverless environments and is recommended for Vercel deployments.

## How It Works

1. **When payment is added:**
   - System automatically generates invoice data
   - Creates PDF from invoice using "classic" template (default)
   - Sends email with PDF attachment to client
   - Uses AWS SES SendRawEmail API for attachments

2. **PDF Generation:**
   - Uses `puppeteer-core` with `@sparticuz/chromium` (serverless)
   - Generates PDF from HTML invoice template
   - Default template: "classic"

3. **Email Sending:**
   - Email includes HTML body with invoice summary
   - PDF attachment: `Invoice-{invoiceNumber}.pdf`
   - Uses AWS SES SendRawEmail for attachments

## Files Created/Updated

1. **`lib/email/pdf-generator.ts`** - PDF generation utility
2. **`lib/email/sender.ts`** - Added `sendEmailWithPDFAttachment()` function
3. **`lib/email/service.ts`** - Added `sendInvoiceEmailWithPDF()` function
4. **`app/api/invoice/send-pdf-email/route.ts`** - API route for sending PDF invoices
5. **`app/payments/page.tsx`** - Updated to send PDF invoices automatically

## Testing

1. Install dependencies:
   ```bash
   npm install puppeteer-core @sparticuz/chromium
   ```

2. Make sure AWS SES is configured (credentials in `.env.local`)

3. Add a payment - the system will automatically:
   - Generate invoice PDF
   - Send email with PDF attachment to client

## Troubleshooting

**PDF generation fails:**
- Make sure `puppeteer-core` and `@sparticuz/chromium` are installed
- Check console for error messages
- System will fallback to HTML email if PDF generation fails

**Email not sending:**
- Check AWS SES configuration
- Verify sender email is verified in SES
- Check email logs in Email Automation → Logs

**PDF attachment not received:**
- Check spam folder
- Verify PDF generation is working (check logs)
- Ensure SendRawEmail permissions in AWS SES

## Default Template

The system uses the **"classic"** invoice template by default. This is the standard invoice layout with clear sections.

To change the template, you would need to modify the `sendInvoiceEmailWithPDF` function in `lib/email/service.ts`.


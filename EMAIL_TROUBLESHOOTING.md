# Email Troubleshooting Guide

## Issue: Emails show as "sent" but not received

If emails are marked as "sent" in the logs but you're not receiving them, follow these steps:

### Step 1: Check Email Configuration

1. **Check if RESEND_API_KEY is configured:**
   - Visit: `http://localhost:3000/api/email/check-config` (or your domain)
   - Should show: `{"configured": true, "status": "Ready"}`

2. **If not configured:**
   - Add `RESEND_API_KEY` to your `.env.local` file
   - Get your API key from: https://resend.com/api-keys
   - Restart your development server

### Step 2: Verify Domain in Resend (CRITICAL)

**This is the most common issue!**

1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Check if `clienova.com` domain is verified
3. If NOT verified:
   - Click "Add Domain"
   - Enter `clienova.com`
   - Add the DNS records provided by Resend to your domain's DNS settings
   - Wait for verification (can take up to 48 hours)

**Important:** If your domain isn't verified, Resend will:
- ✅ Accept the email (return success/messageId)
- ❌ NOT actually send it (emails are silently dropped)

### Step 3: Use Resend Test Domain (Quick Test)

For immediate testing, you can use Resend's test domain:

1. The sender email is currently: `support@clienova.com`
2. Temporarily, you can use: `onboarding@resend.dev` (Resend's test domain)
3. Or verify your domain first (recommended)

### Step 4: Check Spam Folder

- Check your spam/junk folder
- Check Gmail's "Promotions" or "Updates" tabs
- Some email providers filter automated emails

### Step 5: Test Email Sending

Test if emails can be sent:

```bash
# Replace with your email
GET http://localhost:3000/api/email/test?to=your-email@example.com
```

Or visit in browser:
```
http://localhost:3000/api/email/test?to=your-email@example.com
```

### Step 6: Check Email Logs

1. Go to **Email Automation → Logs** in your dashboard
2. Look for:
   - ✅ **Sent** emails (green) - should have messageId
   - ❌ **Failed** emails (red) - check error messages
   - ⏳ **Queued** emails - check if they're being processed

### Step 7: Verify Queue Processing

1. Check if queue processor is running:
   - Visit: `http://localhost:3000/api/email/process-queue`
   - Should return: `{"success": true, "processed": X, ...}`

2. **For production (Vercel):**
   - Cron job should run every 2 minutes (configured in `vercel.json`)
   - Check Vercel logs to see if cron is executing

3. **For local development:**
   - Queue processor doesn't run automatically
   - Manually call: `GET /api/email/process-queue`
   - Or set up a local cron job

### Step 8: Check Resend Dashboard

1. Go to [Resend Dashboard → Emails](https://resend.com/emails)
2. Check:
   - **Sent** - emails that were successfully delivered
   - **Bounced** - emails that were rejected
   - **Complaints** - spam reports

### Common Issues & Solutions

**Issue: "Email service not configured"**
- ✅ Solution: Add `RESEND_API_KEY` to `.env.local`

**Issue: Emails marked "sent" but not received**
- ✅ Solution: **Verify your domain in Resend** (most common)
- ✅ Solution: Check spam folder
- ✅ Solution: Use verified test domain temporarily

**Issue: "Failed to send email" errors**
- ✅ Solution: Check Resend dashboard for error details
- ✅ Solution: Verify domain is verified
- ✅ Solution: Check API key is valid

**Issue: Queue not processing**
- ✅ Solution: Check `vercel.json` cron configuration
- ✅ Solution: Manually call `/api/email/process-queue`
- ✅ Solution: Check server logs for errors

### Quick Fix Checklist

- [ ] RESEND_API_KEY is set in `.env.local`
- [ ] Domain `clienova.com` is verified in Resend
- [ ] Test email works: `/api/email/test?to=your-email@example.com`
- [ ] Queue processor is running (check `/api/email/process-queue`)
- [ ] Check spam folder
- [ ] Check Resend dashboard for delivery status
- [ ] Check email logs in dashboard for error messages

### Next Steps

1. **Immediate:** Verify your domain in Resend (most important!)
2. **Quick Test:** Use `/api/email/test?to=your-email@example.com` to test
3. **Check Logs:** Review Email Automation → Logs for errors
4. **Verify Delivery:** Check Resend dashboard for actual delivery status

---

**Note:** Resend will accept emails even if the domain isn't verified (which is why you see "sent" status), but they won't actually be delivered. Domain verification is required for actual email delivery.

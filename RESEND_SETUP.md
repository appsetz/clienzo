# Resend Email Integration Setup

## ✅ Integration Complete!

Resend has been integrated into your email automation system.

## 🔑 Setup Instructions

### Step 1: Add API Key to Environment Variables

Add your Resend API key to `.env.local` file (create it if it doesn't exist):

```env
RESEND_API_KEY=re_LDBfgQk7_2J57mDDWUy1JXJzx1PJXSauw
```

**Important:** 
- If you're running locally, restart your development server after adding the key
- If you're deploying to Vercel/other platforms, add `RESEND_API_KEY` as an environment variable in your deployment settings

### Step 2: Verify Your Domain (Recommended)

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add and verify your domain (e.g., `clienova.com`)
3. Add the DNS records provided by Resend to your domain's DNS settings
4. Once verified, you can use `support@clienova.com` as the sender email

**Note:** If you haven't verified a domain yet, Resend provides a test domain you can use temporarily.

### Step 3: Test Email Sending

1. Make sure your dev server is running with the API key set
2. Test the configuration:
   ```
   GET http://localhost:3000/api/email/check-config
   ```
   Should return: `{"configured": true, "status": "Ready"}`

3. Send a test email:
   ```
   GET http://localhost:3000/api/email/test?to=your-email@example.com
   ```
   Replace `your-email@example.com` with your actual email address

### Step 4: Verify Email Automation is Working

1. Go to **Email Automation → Settings** in your dashboard
2. Enable email automation
3. Create a test client or project to trigger an email
4. Check **Email Automation → Logs** to see if emails are being sent

## 📧 Features Available

- ✅ Regular email sending (welcome emails, project updates, etc.)
- ✅ PDF invoice attachments
- ✅ Queue-based email processing
- ✅ Automatic retry logic
- ✅ Email logs and tracking

## 🔧 Troubleshooting

**"Email service not configured"**
- Make sure `RESEND_API_KEY` is set in `.env.local`
- Restart your development server after adding the key
- Check that the key doesn't have extra spaces or quotes

**"Failed to send email" errors**
- Verify your domain in Resend dashboard
- Check that the sender email (`support@clienova.com`) is verified
- Check Resend dashboard for error logs

**Emails not being sent**
- Check Email Automation → Logs for error messages
- Verify your Resend account has available credits
- Check that email automation is enabled in Settings

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/emails)


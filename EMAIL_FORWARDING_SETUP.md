# Email Forwarding Setup for notifications@clienova.com

## Quick Setup Guide

Since you own `clienova.com` but don't have inbox access to `notifications@clienova.com`, you can set up email forwarding.

## Step 1: Find Your Domain Registrar

Where did you buy `clienova.com`?
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare
- Other?

## Step 2: Set Up Email Forwarding

### For Namecheap:
1. Log in to Namecheap
2. Go to Domain List → Manage `clienova.com`
3. Click "Advanced DNS" tab
4. Add "Email Forwarding" record:
   - Type: Email Forwarding
   - Host: notifications
   - Forward to: your-email@gmail.com (or any email you can access)
5. Save

### For GoDaddy:
1. Log in to GoDaddy
2. Go to My Products → Domains → `clienova.com`
3. Click "Email" or "Email Forwarding"
4. Create forwarding:
   - From: notifications@clienova.com
   - To: your-email@gmail.com
5. Save

### For Google Domains:
1. Log in to Google Domains
2. Click on `clienova.com`
3. Go to "Email" section
4. Add email forwarding:
   - notifications@clienova.com → your-email@gmail.com
5. Save

### For Cloudflare:
1. Log in to Cloudflare
2. Select `clienova.com`
3. Go to Email → Email Routing
4. Add route:
   - Address: notifications@clienova.com
   - Destination: your-email@gmail.com
5. Save

### For Other Registrars:
- Look for "Email Forwarding" or "Email Routing" in domain settings
- Create forwarding from `notifications@clienova.com` to your accessible email

## Step 3: Wait for Propagation

- Email forwarding usually works within 5-15 minutes
- Sometimes up to 24 hours

## Step 4: Verify in AWS SES

Once forwarding is set up:
1. Go to AWS SES Console (eu-north-1)
2. Create identity: `notifications@clienova.com`
3. AWS will send verification email
4. It will go to `notifications@clienova.com`
5. Your forwarding will send it to your email
6. Click verification link
7. Done!

## Alternative: Use Different Email

If you prefer not to set up forwarding, tell me which email on clienova.com you CAN access, and I'll update the code to use that instead.

Examples:
- hello@clienova.com
- support@clienova.com
- info@clienova.com
- contact@clienova.com


# 📧 Email Automation Setup Guide

Complete step-by-step guide to set up and use email automation in Clienova.

---

## ✅ Prerequisites

Before you start, make sure:

1. **AWS SES is configured** ✅
   - AWS credentials are in `.env.local`:
     ```
     AWS_ACCESS_KEY_ID=your_key
     AWS_SECRET_ACCESS_KEY=your_secret
     AWS_REGION=eu-north-1
     ```
   - Sender email `notifications@clienova.com` is verified in AWS SES
   - If in sandbox mode, verify recipient emails too (or request production access)

2. **You're logged in as an Agency** ✅
   - Email automation is only available for agency accounts

---

## 🚀 Step-by-Step Setup

### Step 1: Access Email Automation

1. Log in to your Clienova account (as an agency)
2. Click **"Email Automation"** in the sidebar
3. You'll see 4 tabs: **Settings**, **Templates**, **Rules**, **Logs**

---

### Step 2: Configure Email Settings

1. Go to **Settings** tab
2. Fill in the form:

   **Enable Email Automation**
   - Toggle **ON** to enable email automation

   **From Name**
   - This is what clients see as the sender name
   - Example: `"AppSetz Agency"` or `"Your Company Name"`
   - This appears as: `AppSetz Agency <notifications@clienova.com>`

   **Reply-To Email**
   - This is where client replies will go
   - Enter your business email: `hello@appsetz.com`
   - When clients click Reply, emails go here

   **Reminder Delay (Days)**
   - How many days to wait before sending overdue reminders
   - Options: 3, 5, 7, or 10 days
   - Example: If invoice is due on Jan 1, reminder sent on Jan 4 (3 days later)

3. Click **"Save Settings"**

✅ **Done!** Your email automation is now configured.

---

### Step 3: Create Email Templates

1. Go to **Templates** tab
2. Click **"New Template"** button
3. Fill in the form:

   **Template Name**
   - Example: `"Welcome Email"`, `"Invoice Email"`, `"Project Update"`

   **Subject**
   - Email subject line
   - Use variables: `{{agency_name}}`, `{{client_name}}`, etc.
   - Example: `"Welcome to {{agency_name}}!"`

   **Body (HTML)**
   - Email content in HTML
   - Use variables: `{{agency_name}}`, `{{client_name}}`, `{{project_name}}`, etc.
   - Example:
     ```html
     <h1>Hi {{client_name}},</h1>
     <p>Welcome to {{agency_name}}! We're excited to work with you.</p>
     <p>Best regards,<br>{{agency_name}}</p>
     ```

4. Click **"Save Template"**

**Available Variables:**
- `{{agency_name}}` - Your agency name
- `{{client_name}}` - Client's name
- `{{project_name}}` - Project name
- `{{invoice_number}}` - Invoice number
- `{{invoice_amount}}` - Invoice amount
- `{{due_date}}` - Due date
- `{{payment_amount}}` - Payment amount

**Create these templates:**
- ✅ Welcome Email (for new clients)
- ✅ Invoice Email (for invoices)
- ✅ Project Started Email
- ✅ Project Completed Email
- ✅ Payment Received Email
- ✅ Invoice Overdue Reminder

---

### Step 4: Create Automation Rules

1. Go to **Automation Rules** tab
2. Click **"New Rule"** button
3. Fill in the form:

   **When (Event)**
   - Select when to send the email:
     - `CLIENT_CREATED` - When a new client is added
     - `PROJECT_STARTED` - When a project starts
     - `PROJECT_COMPLETED` - When a project is completed
     - `INVOICE_CREATED` - When an invoice is generated
     - `PAYMENT_RECEIVED` - When a payment is received
     - `INVOICE_OVERDUE` - When an invoice is overdue

   **Email Template**
   - Select which template to use

   **Delay (Minutes)**
   - How many minutes to wait before sending
   - `0` = Send immediately
   - `60` = Send after 1 hour
   - `1440` = Send after 1 day

   **Enabled**
   - Toggle ON to activate the rule

4. Click **"Save Rule"**

**Example Rules:**

| Event | Template | Delay | When It Sends |
|-------|----------|-------|---------------|
| CLIENT_CREATED | Welcome Email | 0 | Immediately when client is created |
| PROJECT_STARTED | Project Started Email | 0 | Immediately when project starts |
| INVOICE_CREATED | Invoice Email | 0 | Immediately when invoice is generated |
| INVOICE_OVERDUE | Invoice Overdue Reminder | 4320 | 3 days after invoice due date |

---

### Step 5: Test the System

1. **Create a test client:**
   - Go to Clients page
   - Click "Add Client"
   - Enter client details (make sure to add an email)
   - Click "Save"
   - ✅ This triggers `CLIENT_CREATED` event

2. **Check Email Queue:**
   - Go to Email Automation → Logs tab
   - You should see the email queued or sent

3. **Process Queue (if needed):**
   - For testing, manually call:
     ```
     GET http://localhost:3000/api/email/process-queue
     ```
   - Or wait for cron job to process it

4. **Check Email Logs:**
   - Go to Email Automation → Logs tab
   - You should see the email with status "sent" ✅

5. **Check Client Inbox:**
   - Client should receive the email
   - Email should show: `Your Agency Name <notifications@clienova.com>`
   - Reply should go to your Reply-To email

---

### Step 6: Set Up Automatic Queue Processing

The email queue needs to be processed automatically. Choose one:

#### Option A: Vercel Cron (Recommended for Vercel)

1. Create `vercel.json` in project root:
   ```json
   {
     "crons": [
       {
         "path": "/api/email/process-queue",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```
2. Deploy to Vercel
3. Vercel will automatically call the endpoint every 5 minutes

#### Option B: External Cron Service

Use services like:
- **cron-job.org** (free)
- **EasyCron** (free tier)
- **GitHub Actions** (free)

Set to call: `https://yourdomain.com/api/email/process-queue` every 5 minutes

#### Option C: Manual (For Development)

For testing, manually call:
```
GET http://localhost:3000/api/email/process-queue
```

---

## 📋 Complete Setup Checklist

- [ ] AWS SES credentials configured in `.env.local`
- [ ] Sender email verified in AWS SES
- [ ] Email Automation → Settings configured
- [ ] At least one email template created
- [ ] At least one automation rule created
- [ ] Tested by creating a client
- [ ] Cron job set up for automatic processing
- [ ] Verified email received in client inbox
- [ ] Verified reply goes to correct email

---

## 🎯 Common Use Cases

### Use Case 1: Welcome New Clients

**Template:**
- Name: "Welcome Email"
- Subject: "Welcome to {{agency_name}}!"
- Body: "Hi {{client_name}}, welcome! We're excited to work with you."

**Rule:**
- Event: `CLIENT_CREATED`
- Template: "Welcome Email"
- Delay: 0 minutes

**Result:** Every new client automatically receives a welcome email!

---

### Use Case 2: Send Invoices Automatically

**Template:**
- Name: "Invoice Email"
- Subject: "Invoice from {{agency_name}} - {{invoice_number}}"
- Body: "Hi {{client_name}}, please find invoice for {{project_name}}. Amount: ₹{{invoice_amount}}, Due: {{due_date}}"

**Rule:**
- Event: `INVOICE_CREATED`
- Template: "Invoice Email"
- Delay: 0 minutes

**Result:** Every invoice is automatically emailed to the client!

---

### Use Case 3: Remind About Overdue Invoices

**Template:**
- Name: "Invoice Overdue Reminder"
- Subject: "Reminder: Invoice {{invoice_number}} is Overdue"
- Body: "Hi {{client_name}}, invoice {{invoice_number}} for ₹{{invoice_amount}} is overdue. Please pay as soon as possible."

**Rule:**
- Event: `INVOICE_OVERDUE`
- Template: "Invoice Overdue Reminder"
- Delay: 4320 minutes (3 days)

**Result:** Clients receive reminders 3 days after invoice is due!

---

## 🆘 Troubleshooting

### Emails Not Sending?

1. **Check AWS SES Status:**
   - Go to AWS SES Console
   - Verify sender email is verified
   - If in sandbox, verify recipient email too

2. **Check Email Logs:**
   - Go to Email Automation → Logs
   - Look for error messages
   - Check status (pending/sent/failed)

3. **Check Queue Processing:**
   - Manually call `/api/email/process-queue`
   - Check console for errors

4. **Check Settings:**
   - Email automation enabled?
   - From Name and Reply-To set?
   - Rules enabled?

### Emails Going to Spam?

1. **Verify SES Sender:**
   - Make sure `notifications@clienova.com` is verified
   - Request production access if in sandbox

2. **Check Email Content:**
   - Avoid spam trigger words
   - Use proper HTML formatting
   - Include unsubscribe link (optional)

### Queue Not Processing?

1. **Check Cron Job:**
   - Is it running?
   - Check cron service logs
   - Verify endpoint URL is correct

2. **Manual Processing:**
   - Call `/api/email/process-queue` manually
   - Check response for errors

---

## 📚 Next Steps

1. **Create More Templates:**
   - Project status updates
   - Payment confirmations
   - Custom messages

2. **Fine-tune Rules:**
   - Adjust delays
   - Create conditional rules
   - Test different scenarios

3. **Monitor Logs:**
   - Check Email Automation → Logs regularly
   - Track delivery rates
   - Fix any failed emails

4. **Request Production Access:**
   - If in sandbox mode, request production access
   - This allows sending to any email address

---

## ✅ You're All Set!

Your email automation is now configured and ready to use. Every time you:
- Create a client → Welcome email sent
- Start a project → Project update sent
- Generate an invoice → Invoice email sent
- Receive payment → Payment confirmation sent

All automatically! 🎉

---

## 💡 Pro Tips

1. **Start Simple:**
   - Create 1-2 templates first
   - Test with your own email
   - Add more templates gradually

2. **Monitor First Week:**
   - Check logs daily
   - Verify emails are being sent
   - Fix any issues early

3. **Customize Templates:**
   - Add your branding
   - Use professional tone
   - Include clear call-to-actions

4. **Test Before Going Live:**
   - Test with your own email first
   - Verify formatting looks good
   - Check mobile responsiveness

---

**Need Help?** Check the logs tab for detailed error messages and status updates.


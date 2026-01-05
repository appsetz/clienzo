# Amazon SES Email Setup Guide

## ✅ Implementation Complete

The Amazon SES integration has been implemented with the following components:

### Files Created/Updated

1. **`lib/email/ses-client.ts`** - SES client setup and configuration
2. **`lib/email/sender.ts`** - Email sending service using SES
3. **`app/api/email/process-queue/route.ts`** - Email queue worker
4. **`lib/email/service.ts`** - Updated to include template/event metadata
5. **`lib/email/types.ts`** - Updated EmailQueueItem interface

## 🔧 Setup Instructions

### Step 1: Configure AWS Credentials

Add to your `.env.local` file:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
```

**How to get AWS credentials:**
1. Go to AWS IAM Console
2. Create a new user or use existing
3. Attach policy: `AmazonSESFullAccess` (or custom policy with SES send permissions)
4. Create access key
5. Copy Access Key ID and Secret Access Key

### Step 2: Verify Sender Email in SES

1. Go to AWS SES Console
2. Verify email address: `notifications@clienova.com`
3. Check your email and click verification link
4. **Important:** Make sure SES is out of sandbox mode (request production access)

### Step 3: Set Up Cron Job

The email worker needs to run periodically. Choose one option:

#### Option A: Vercel Cron (Recommended for Vercel)

Create `vercel.json` in project root:

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

#### Option B: External Cron Service

Use services like:
- cron-job.org
- EasyCron
- GitHub Actions

Set to call: `https://yourdomain.com/api/email/process-queue` every 5 minutes

#### Option C: Manual Testing

For development, manually call:
```bash
curl https://yourdomain.com/api/email/process-queue
```

### Step 4: Optional - Protect Worker Endpoint

Add to `.env.local`:
```env
CRON_SECRET=your_random_secret_here
```

Then configure your cron service to send:
```
Authorization: Bearer your_random_secret_here
```

## 📧 Email Format

All emails follow this format:

```
From: Agency Name <notifications@clienova.com>
Reply-To: agency@email.com
To: client@email.com
```

**Example:**
```
From: AppSetz Agency <notifications@clienova.com>
Reply-To: hello@appsetz.com
```

## 🔄 How It Works

1. **Event Occurs** → `triggerEmailEvent()` is called
2. **Rule Matches** → Automation rule finds matching template
3. **Email Queued** → Email added to `email_queue` collection
4. **Worker Processes** → Cron calls `/api/email/process-queue`
5. **SES Sends** → Email delivered via Amazon SES
6. **Status Updated** → Queue item marked as sent/failed
7. **Logged** → Email log created for tracking

## 🛡️ Error Handling

- **Retry Logic:** Failed emails retry up to 3 times with exponential backoff
- **Error Logging:** All failures logged with error messages
- **No Crashes:** Worker never crashes, continues processing other emails
- **Duplicate Prevention:** Each email has unique ID

## 📊 Monitoring

Check email status:
1. **Email Logs** → `/email-automation` → Logs tab
2. **Firestore** → `email_queue` collection (status: pending/sent/failed)
3. **AWS SES** → SES Console → Sending Statistics

## 🧪 Testing

### Step 1: Check Configuration

Test if AWS credentials are properly configured:

```bash
# In browser or curl
GET https://yourdomain.com/api/email/check-config
```

Expected response:
```json
{
  "configured": true,
  "status": "Ready",
  "configuration": {
    "AWS_ACCESS_KEY_ID": "✅ Set",
    "AWS_SECRET_ACCESS_KEY": "✅ Set",
    "AWS_REGION": "us-east-1"
  }
}
```

### Step 2: Test Email Sending

Send a test email to verify SES is working:

```bash
# Replace with your email address
GET https://yourdomain.com/api/email/test?to=your-email@example.com
```

**Important:** Make sure the recipient email is verified in SES (if you're in sandbox mode).

### Step 3: Test Queue Processing

1. Create a client (triggers CLIENT_CREATED event)
2. Check `email_queue` collection in Firestore
3. Manually call `/api/email/process-queue`
4. Check email logs in the UI

### Step 4: Test Full Flow

1. Go to Email Automation → Settings
2. Enable automation and configure settings
3. Go to Templates → Verify default templates exist
4. Go to Automation Rules → Create a rule (e.g., "When Client Created → Send Welcome Email")
5. Create a new client
6. Check Email Logs to see if email was sent

## ⚠️ Important Notes

- **SES Sandbox:** In sandbox mode, you can only send to verified emails
- **Rate Limits:** SES has sending limits (check AWS console)
- **Bounce Handling:** Set up SNS for bounce/complaint notifications (optional)
- **Cost:** SES is very cheap (~$0.10 per 1000 emails)

## 🔒 Security

- ✅ AWS credentials stored in environment variables
- ✅ No SES keys exposed to frontend
- ✅ Worker endpoint can be protected with CRON_SECRET
- ✅ All automation logic in Clienova (not SES)

## 📝 Next Steps

1. ✅ Configure AWS credentials
2. ✅ Verify sender email in SES
3. ✅ Set up cron job
4. ✅ Test with real email
5. ✅ Monitor email logs
6. ⚠️ Request SES production access (if in sandbox)

## 🆘 Troubleshooting

**Emails not sending?**
- Check AWS credentials are correct
- Verify sender email in SES
- Check SES is out of sandbox
- Review worker logs

**Queue not processing?**
- Verify cron job is running
- Check `/api/email/process-queue` endpoint
- Review Firestore `email_queue` collection

**SES errors?**
- Check AWS IAM permissions
- Verify sender email
- Check recipient email format
- Review SES sending limits


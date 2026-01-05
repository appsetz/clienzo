# ✅ Email Setup Complete - Next Steps

## 🎉 Congratulations!

Your email `notifications@clienova.com` is verified in AWS SES. You're ready to send emails!

## 🧪 Step 1: Test Email Sending

Test if everything works:

### Option A: Browser
```
http://localhost:3000/api/email/test?to=your-email@example.com
```

### Option B: Terminal
```bash
curl "http://localhost:3000/api/email/test?to=your-email@example.com"
```

**Replace `your-email@example.com` with an email you can check.**

**Note:** If SES is in sandbox mode, you also need to verify the recipient email in AWS SES.

## 📧 Step 2: Configure Email Automation Settings

1. **Go to Email Automation** → **Settings** tab
2. **Enable Email Automation** (toggle ON)
3. **From Name**: Enter your agency name (e.g., "Your Agency Name")
4. **Reply-To Email**: Enter your business email (where replies should go)
5. **Reminder Delay**: Choose 3, 5, 7, or 10 days
6. **Click "Save Settings"**

## 🔄 Step 3: Set Up Automation Rules

1. **Go to Email Automation** → **Automation Rules** tab
2. **Click "New Rule"**
3. **When (Event)**: Select "Client Created"
4. **Email Template**: Select "Welcome Email"
5. **Delay**: 0 minutes (send immediately)
6. **Click "Save Rule"**

## 🎯 Step 4: Test Full Automation Flow

1. **Create a new client** (in Clients page)
   - This triggers CLIENT_CREATED event
   - Email will be queued

2. **Process the queue** (manually for now):
   ```
   GET http://localhost:3000/api/email/process-queue
   ```

3. **Check Email Logs**:
   - Go to Email Automation → Logs tab
   - You should see the sent email! ✅

## ⏰ Step 5: Set Up Cron Job (For Automatic Processing)

The email queue needs to be processed automatically. Choose one:

### Option A: Vercel Cron (If deploying to Vercel)

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

### Option B: External Cron Service

Use services like:
- cron-job.org
- EasyCron
- GitHub Actions

Set to call: `https://yourdomain.com/api/email/process-queue` every 5 minutes

### Option C: Manual (For Development)

For now, you can manually call:
```
GET http://localhost:3000/api/email/process-queue
```

## 📋 Step 6: Add Event Triggers (For Full Automation)

Add triggers to your pages so emails are sent automatically:

### Client Created Event
**File:** `app/clients/page.tsx`

After `createClient` succeeds, add:
```typescript
import { triggerEmailEvent } from "@/lib/email/service";

// After creating client:
if (userProfile?.userType === "agency" && formData.email) {
  try {
    await triggerEmailEvent(
      user.uid,
      "CLIENT_CREATED",
      {
        agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
        client_name: formData.name,
      },
      formData.email
    );
  } catch (error) {
    console.error("Error triggering email event:", error);
  }
}
```

See `EMAIL_AUTOMATION_SETUP.md` for all event triggers.

## ✅ Checklist

- [x] Email verified in AWS SES
- [ ] Test email sent successfully
- [ ] Email automation settings configured
- [ ] Automation rules created
- [ ] Event triggers added to pages
- [ ] Cron job set up
- [ ] Full flow tested

## 🚀 You're Ready!

Your email system is set up and verified. Start by:
1. Testing email sending
2. Configuring automation settings
3. Creating your first automation rule
4. Testing the full flow

## 🆘 Troubleshooting

**Test email not received?**
- Check spam folder
- If in sandbox mode, verify recipient email in SES
- Check email logs for errors

**Queue not processing?**
- Manually call `/api/email/process-queue`
- Check Firestore `email_queue` collection
- Review console for errors

**Emails not triggering?**
- Make sure automation rules are enabled
- Check event triggers are added to pages
- Verify email settings are enabled


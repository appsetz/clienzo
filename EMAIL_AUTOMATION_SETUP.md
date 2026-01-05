# Email Automation Setup Guide

## ✅ What's Already Done

- Email automation UI (Settings, Templates, Rules, Logs)
- Email queue system in Firestore
- Template management
- Automation rules configuration
- Email logging system

## 🔧 What You Need to Do Next

### Step 1: Add Event Triggers (Required)

You need to trigger email events when actions happen in your app. Add these triggers to the relevant pages:

#### 1.1 Client Created Event
**File:** `app/clients/page.tsx` or wherever clients are created

```typescript
import { triggerEmailEvent } from "@/lib/email/service";

// After successfully creating a client:
await triggerEmailEvent(
  user.uid,
  "CLIENT_CREATED",
  {
    agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
    client_name: clientData.name,
  },
  clientData.email // recipient email
);
```

#### 1.2 Project Started Event
**File:** `app/projects/page.tsx` or `app/projects/[id]/page.tsx`

```typescript
// When project status changes to "in_progress" or project is created:
await triggerEmailEvent(
  user.uid,
  "PROJECT_STARTED",
  {
    agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
    client_name: client.name,
    project_name: projectData.name,
  },
  client.email
);
```

#### 1.3 Project Completed Event
**File:** `app/projects/[id]/page.tsx`

```typescript
// When project status changes to "completed":
await triggerEmailEvent(
  user.uid,
  "PROJECT_COMPLETED",
  {
    agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
    client_name: client.name,
    project_name: project.name,
  },
  client.email
);
```

#### 1.4 Invoice Created Event
**File:** `app/payments/page.tsx` or wherever invoices are generated

```typescript
// When invoice is created:
await triggerEmailEvent(
  user.uid,
  "INVOICE_CREATED",
  {
    agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
    client_name: client.name,
    project_name: project.name,
    invoice_number: invoiceNumber,
    invoice_amount: amount.toLocaleString(),
    due_date: format(dueDate, "MMM dd, yyyy"),
  },
  client.email
);
```

#### 1.5 Payment Received Event
**File:** `app/payments/page.tsx`

```typescript
// When payment is received:
await triggerEmailEvent(
  user.uid,
  "PAYMENT_RECEIVED",
  {
    agency_name: userProfile?.agencyName || userProfile?.name || "Your Agency",
    client_name: client.name,
    invoice_number: invoiceNumber,
    payment_amount: amount.toLocaleString(),
  },
  client.email
);
```

#### 1.6 Invoice Overdue Event
**File:** Create a new API route or cron job: `app/api/email/check-overdue/route.ts`

This should run daily to check for overdue invoices and send reminders.

### Step 2: Set Up Email Provider (Required)

Choose one email provider and get an API key:

#### Option A: Resend (Recommended - Easy Setup)
1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Update `lib/email/sender.ts` to use Resend SDK:
   ```bash
   npm install resend
   ```

#### Option B: Brevo (Sendinblue)
1. Sign up at https://www.brevo.com
2. Get your API key
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_BREVO_API_KEY=xxxxxxxxxxxxx
   ```

#### Option C: Amazon SES
1. Set up AWS SES
2. Get access keys
3. Add to `.env.local`:
   ```
   AWS_ACCESS_KEY_ID=xxxxx
   AWS_SECRET_ACCESS_KEY=xxxxx
   AWS_REGION=us-east-1
   ```

### Step 3: Create Email Worker (Required)

Create an API route to process the email queue. This will be called periodically.

**File:** `app/api/email/process-queue/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { sendEmail } from "@/lib/email/sender";
import { logEmail } from "@/lib/email/service";
import { EmailQueueItem } from "@/lib/email/types";

export async function GET() {
  try {
    // Get pending emails that are ready to send
    const now = new Date();
    const q = query(
      collection(db, "email_queue"),
      where("status", "==", "pending")
    );
    
    const snapshot = await getDocs(q);
    const emails: EmailQueueItem[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const sendAt = data.sendAt?.toDate();
      if (sendAt && sendAt <= now) {
        emails.push({ id: doc.id, ...data } as EmailQueueItem);
      }
    });

    // Process each email
    for (const email of emails) {
      try {
        const result = await sendEmail(
          email.to,
          email.subject,
          email.body,
          email.fromName,
          email.replyTo
        );

        if (result.success) {
          // Update queue status
          await updateDoc(doc(db, "email_queue", email.id), {
            status: "sent",
            sentAt: new Date(),
            messageId: result.messageId,
          });

          // Log email
          await logEmail(
            email.userId,
            email.to,
            email.subject,
            "Template Name", // You may want to store this in queue
            "CLIENT_CREATED", // You may want to store this in queue
            "sent"
          );
        } else {
          // Handle failure
          const retryCount = email.retryCount + 1;
          if (retryCount < 3) {
            await updateDoc(doc(db, "email_queue", email.id), {
              retryCount,
              error: result.error,
            });
          } else {
            await updateDoc(doc(db, "email_queue", email.id), {
              status: "failed",
              error: result.error,
            });
          }
        }
      } catch (error: any) {
        console.error(`Error processing email ${email.id}:`, error);
      }
    }

    return NextResponse.json({ 
      processed: emails.length,
      message: "Queue processed successfully" 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Step 4: Set Up Cron Job (Required)

You need to call the email worker periodically. Options:

#### Option A: Vercel Cron (If using Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/email/process-queue",
    "schedule": "*/5 * * * *"
  }]
}
```

#### Option B: External Cron Service
Use services like:
- cron-job.org
- EasyCron
- GitHub Actions (for free tier)

Set them to call: `https://yourdomain.com/api/email/process-queue` every 5 minutes

#### Option C: Manual Testing
For development, you can manually call:
```
GET https://localhost:3000/api/email/process-queue
```

### Step 5: Update Firestore Security Rules

Add rules for email collections in `firestore.rules`:

```javascript
match /email_settings/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

match /email_templates/{templateId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}

match /automation_rules/{ruleId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}

match /email_queue/{queueId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}

match /email_logs/{logId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow write: if false; // Only system can write logs
}
```

### Step 6: Test the System

1. **Configure Settings:**
   - Go to Email Automation → Settings
   - Enable automation
   - Set From Name and Reply-To email

2. **Create a Test Rule:**
   - Go to Email Automation → Automation Rules
   - Create rule: "When Client Created → Send Welcome Email"

3. **Test Event:**
   - Create a new client
   - Check Email Logs to see if email was queued/sent

4. **Check Queue:**
   - Manually call `/api/email/process-queue`
   - Check Email Logs for sent status

## 📋 Quick Checklist

- [ ] Add event triggers in client creation
- [ ] Add event triggers in project creation/updates
- [ ] Add event triggers in invoice creation
- [ ] Add event triggers in payment creation
- [ ] Set up email provider (Resend/Brevo/SES)
- [ ] Create email worker API route
- [ ] Set up cron job to process queue
- [ ] Update Firestore security rules
- [ ] Test with a real email
- [ ] Set up overdue invoice checker (optional)

## 🚀 Priority Order

1. **High Priority:** Set up email provider + Create email worker
2. **High Priority:** Add event triggers (at least CLIENT_CREATED and INVOICE_CREATED)
3. **Medium Priority:** Set up cron job
4. **Medium Priority:** Update Firestore rules
5. **Low Priority:** Overdue invoice checker

## 💡 Tips

- Start with Resend - it's the easiest to set up
- Test with your own email first
- Check email logs regularly to debug issues
- Use the placeholder provider for development (it just logs emails)
- Make sure client emails are valid before triggering events

## 🆘 Troubleshooting

- **Emails not sending?** Check email provider API key
- **Queue not processing?** Check cron job is running
- **Events not triggering?** Check console for errors
- **Templates not working?** Check variable names match exactly


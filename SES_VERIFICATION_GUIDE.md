# AWS SES Email Verification Guide for clienova.com

## ✅ You're All Set!

Since you own `clienova.com`, you can use `notifications@clienova.com` - the code is already configured for it!

## Step-by-Step Verification

### Step 1: Go to AWS SES Console

1. Open: https://console.aws.amazon.com/ses/
2. **Important:** Make sure you're in the **eu-north-1** region (matches your AWS_REGION)
3. Click on the region dropdown (top right) and select **Europe (Stockholm) eu-north-1**

### Step 2: Verify Email Address

1. In the left sidebar, click **"Verified identities"**
2. Click **"Create identity"** button (top right)
3. Select **"Email address"** (not domain)
4. Enter: `notifications@clienova.com`
5. Click **"Create identity"**

### Step 3: Check Your Email

1. AWS will send a verification email to `notifications@clienova.com`
2. **Important:** You need to have access to this email inbox
3. Check the inbox for `notifications@clienova.com`
4. Open the email from AWS SES
5. Click the verification link

### Step 4: Verify Status

1. Go back to AWS SES Console → Verified identities
2. You should see `notifications@clienova.com` with status **"Verified"** ✅
3. Once verified, you can send emails!

## ⚠️ Important: Email Access

**Question:** Do you have access to the `notifications@clienova.com` inbox?

- ✅ **Yes, I can check that email** → Follow steps above
- ❌ **No, I don't have that email set up** → You have 2 options:

### Option A: Set Up Email Forwarding (Recommended)

1. In your domain registrar (where you bought clienova.com):
   - Set up email forwarding for `notifications@clienova.com`
   - Forward to an email you can access (e.g., your personal Gmail)
2. Then verify in SES (AWS will send to notifications@clienova.com, which forwards to your email)

### Option B: Use a Different Email You Control

If you can't access `notifications@clienova.com`, you can use:
- `hello@clienova.com`
- `support@clienova.com`
- `noreply@clienova.com`
- Any email on your domain you can access

Then I'll update the code to use that email instead.

## Step 5: Test Email Sending

Once verified, test it:

```
GET http://localhost:3000/api/email/test?to=your-email@example.com
```

Replace `your-email@example.com` with an email you can check.

**Note:** If SES is in **sandbox mode**, you also need to verify the recipient email.

## Step 6: Request Production Access (If Needed)

If you're in sandbox mode:
1. Go to AWS SES Console → Account dashboard
2. Click **"Request production access"**
3. Fill out the form (explain your use case)
4. Usually approved within 24 hours

## Current Configuration

Your setup:
- ✅ Domain: `clienova.com` (you own it)
- ✅ Sender email: `notifications@clienova.com` (configured in code)
- ✅ AWS Region: `eu-north-1` (matches your config)
- ⏳ Email verification: **Pending** (do this now)

## Quick Checklist

- [ ] Access AWS SES Console (eu-north-1 region)
- [ ] Create identity: `notifications@clienova.com`
- [ ] Check email inbox for verification link
- [ ] Click verification link
- [ ] Confirm "Verified" status in SES
- [ ] Test email sending
- [ ] Request production access (if in sandbox)

## Need Help?

**Can't access notifications@clienova.com?**
- Tell me which email on clienova.com you can access
- I'll update the code to use that instead

**Verification email not received?**
- Check spam folder
- Wait a few minutes
- Try resending verification in SES console

**Already verified?**
- Great! Test sending: `/api/email/test?to=your-email@example.com`


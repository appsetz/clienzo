# Fix: "Email was rejected by SES"

## 🔍 Problem

The error "Email was rejected by SES (check recipient address)" usually means:

1. **SES is in Sandbox Mode** (most common)
   - In sandbox mode, you can ONLY send to verified email addresses
   - You need to verify the recipient email in AWS SES

2. **Recipient email not verified**
   - Even though sender is verified, recipient must also be verified in sandbox mode

## ✅ Solution 1: Verify Recipient Email (Quick Fix for Testing)

### Step 1: Verify Recipient Email in SES

1. Go to AWS SES Console: https://console.aws.amazon.com/ses/
2. Make sure you're in **eu-north-1** region
3. Click **"Verified identities"**
4. Click **"Create identity"**
5. Select **"Email address"**
6. Enter the recipient email (the one you're testing with)
7. Click **"Create identity"**
8. Check that email inbox
9. Click verification link
10. Wait for "Verified" status

### Step 2: Test Again

Once recipient is verified, test again:
```
GET http://localhost:3000/api/email/test?to=verified-email@example.com
```

## ✅ Solution 2: Request Production Access (Permanent Fix)

To send to ANY email address (not just verified ones):

### Step 1: Request Production Access

1. Go to AWS SES Console: https://console.aws.amazon.com/ses/
2. Make sure you're in **eu-north-1** region
3. Click **"Account dashboard"** (left sidebar)
4. Look for **"Sending limits"** section
5. You'll see: **"Your account is in the Amazon SES sandbox"**
6. Click **"Request production access"** button

### Step 2: Fill Out Request Form

Fill out the form with:
- **Mail Type**: Transactional
- **Website URL**: Your website URL
- **Use case description**: 
  ```
  We are sending transactional emails to our clients for:
  - Welcome emails when clients are created
  - Project status updates
  - Invoice notifications
  - Payment confirmations
  - Automated reminders
  
  All emails are opt-in and sent to clients who have accounts with our platform.
  ```
- **Compliance**: Check boxes for:
  - ✅ We only send emails to recipients who have explicitly requested to receive them
  - ✅ We have a process to handle bounces and complaints
  - ✅ We understand that sending unsolicited email will result in account suspension

### Step 3: Wait for Approval

- Usually approved within 24 hours
- Sometimes instant
- Check email for approval notification

### Step 4: Test Again

Once approved, you can send to ANY email address!

## 🔍 Check Your Current Status

To check if you're in sandbox mode:

1. Go to AWS SES Console
2. Click "Account dashboard"
3. Look at "Sending limits"
4. If it says "Your account is in the Amazon SES sandbox" → You're in sandbox
5. If it shows production limits → You're in production mode

## 📋 Quick Checklist

**For Testing (Sandbox Mode):**
- [ ] Verify sender email: `notifications@clienova.com` ✅ (Already done)
- [ ] Verify recipient email: `your-test-email@example.com` ⏳ (Do this now)
- [ ] Test sending again

**For Production:**
- [ ] Request production access
- [ ] Wait for approval
- [ ] Send to any email address

## 🎯 Recommended Action

**Right Now:**
1. Verify the recipient email you're testing with
2. Test again

**Today:**
1. Request production access
2. Fill out the form properly
3. Wait for approval

**Once Approved:**
- You can send to any email address
- No need to verify recipients
- Full automation ready!

## 💡 Pro Tip

While waiting for production access:
- Verify a few test emails you commonly use
- Test the full automation flow
- Make sure everything works
- Once production access is approved, you're ready to go!


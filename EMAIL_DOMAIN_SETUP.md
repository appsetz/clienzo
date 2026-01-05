# Email Domain Setup Guide

## Understanding Email Addresses

You don't need to "buy" an email address. You need to **own/control the domain** that the email is on.

For `notifications@clienova.com`, you need to:
- Own the domain `clienova.com` OR
- Use a domain you already own OR
- Use a different approach

## Option 1: Use Your Own Domain (Recommended)

If you own a domain (e.g., `yourcompany.com`), you can use:

```
notifications@yourcompany.com
```

**Steps:**
1. Update the sender email in `lib/email/sender.ts`:
   ```typescript
   const VERIFIED_SENDER_EMAIL = "notifications@yourcompany.com";
   ```

2. Verify this email in AWS SES Console

3. Done! No domain purchase needed if you already own it.

## Option 2: Use a Subdomain

If you have a domain, create a subdomain:

```
notifications@mail.yourcompany.com
notifications@notify.yourcompany.com
```

**Steps:**
1. Create subdomain in your domain registrar
2. Update sender email in code
3. Verify in SES

## Option 3: Use a Generic Domain (Quick Start)

For MVP/testing, you can use a generic email service domain:

### Option 3A: Use Your Personal Email Domain
If you have Gmail/Outlook, you can't use those directly, but you could:
- Use a domain you own
- Use a service like Mailgun's domain (if using Mailgun)

### Option 3B: Use AWS SES Verified Email
- Verify any email address you control in SES
- Use that as the sender
- Example: `notifications@yourpersonaldomain.com`

## Option 4: Buy Domain (If Needed)

If you don't own any domain and want `clienova.com`:

1. **Buy the domain:**
   - Go to domain registrar (Namecheap, GoDaddy, Google Domains)
   - Search for `clienova.com`
   - Purchase if available (~$10-15/year)

2. **Set up email:**
   - You don't need email hosting
   - Just verify the email in AWS SES
   - SES will send from it

3. **Cost:** ~$10-15/year for domain (no email hosting needed)

## Current Setup

Right now, the code uses:
```
notifications@clienova.com
```

**You have 3 choices:**

### Choice 1: Use a domain you already own
- Update `VERIFIED_SENDER_EMAIL` in `lib/email/sender.ts`
- Verify that email in SES

### Choice 2: Buy clienova.com domain
- Purchase domain (~$10-15/year)
- Verify `notifications@clienova.com` in SES
- No code changes needed

### Choice 3: Use a different email
- Change to an email on a domain you control
- Update code and verify in SES

## Recommendation

**For MVP/Testing:**
- Use any email on a domain you own
- Or use a test email you can verify

**For Production:**
- Use a professional domain (buy if needed)
- Use `notifications@yourdomain.com` format
- Keep it consistent with your brand

## Cost Breakdown

- **Domain:** $10-15/year (if you don't own one)
- **Email hosting:** $0 (SES handles sending)
- **AWS SES:** ~$0.10 per 1000 emails (very cheap)
- **Total:** ~$10-15/year + email sending costs

## Quick Decision Guide

✅ **You own a domain?** → Use `notifications@yourdomain.com`
✅ **No domain, want professional?** → Buy domain (~$10-15/year)
✅ **Just testing?** → Use any email you can verify in SES
✅ **Want to keep clienova.com?** → Buy that domain

## Next Steps

1. Decide which option you want
2. If changing email, update `lib/email/sender.ts`
3. Verify the email in AWS SES Console
4. Test sending


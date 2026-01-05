# Quick Email Forwarding Setup

## What You Need to Do

1. **Log in to your domain registrar** (where you bought clienova.com)
2. **Set up email forwarding**: `notifications@clienova.com` → `your-email@example.com`
3. **Wait 5-15 minutes** for it to activate
4. **Verify in AWS SES** (verification email will forward to you)

## Step-by-Step by Registrar

### Namecheap
1. Login → Domain List → Manage `clienova.com`
2. Click "Advanced DNS" tab
3. Find "Email Forwarding" section
4. Add: `notifications` → Forward to: `your-email@gmail.com`
5. Save

### GoDaddy
1. Login → My Products → Domains → `clienova.com`
2. Click "Email" or "Email Forwarding"
3. Create: `notifications@clienova.com` → `your-email@gmail.com`
4. Save

### Cloudflare
1. Login → Select `clienova.com`
2. Email → Email Routing
3. Add route: `notifications@clienova.com` → `your-email@gmail.com`
4. Save

### Google Domains
1. Login → Click `clienova.com`
2. Email section → Email forwarding
3. Add: `notifications@clienova.com` → `your-email@gmail.com`
4. Save

## After Forwarding is Set Up

1. **Go to AWS SES Console**: https://console.aws.amazon.com/ses/
2. **Select region**: Europe (Stockholm) eu-north-1
3. **Verified identities** → **Create identity**
4. **Email address**: `notifications@clienova.com`
5. **Create identity**
6. **Check your email** (the one you forwarded to)
7. **Click verification link**
8. **Done!** ✅

## Test It

Once verified, test:
```
GET http://localhost:3000/api/email/test?to=your-email@example.com
```

## Need Help?

**Can't find email forwarding?**
- Look for: "Email", "Email Routing", "Email Forwarding", "Catch-all"
- Check domain DNS settings
- Contact your registrar support

**Forwarding not working?**
- Wait 15-30 minutes (DNS propagation)
- Check spam folder
- Try sending a test email to notifications@clienova.com


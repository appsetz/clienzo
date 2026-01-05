# Email Queue Processor - How to Send Queued Emails

## The Issue
Emails are being queued correctly, but they're not being sent automatically because the queue processor needs to be triggered.

## Quick Fix: Manual Processing (For Testing)

### Option 1: Browser (Easiest)
1. Open your browser
2. Go to: `http://localhost:3000/api/email/process-queue` (if running locally)
   OR: `https://yourdomain.com/api/email/process-queue` (if deployed)
3. You should see a JSON response like:
   ```json
   {
     "success": true,
     "processed": 2,
     "results": {
       "sent": 2,
       "failed": 0,
       "retried": 0
     }
   }
   ```

### Option 2: Terminal/Command Line
```bash
# If running locally:
curl http://localhost:3000/api/email/process-queue

# If deployed:
curl https://yourdomain.com/api/email/process-queue
```

## Permanent Solution: Automatic Processing

### If Using Vercel:
1. The `vercel.json` file is already created
2. **Deploy your code to Vercel**
3. Vercel will automatically call `/api/email/process-queue` every 2 minutes
4. Emails will be sent automatically! ✅

### If NOT Using Vercel:
Use an external cron service:

**Option A: cron-job.org (Free)**
1. Sign up at https://cron-job.org
2. Create a new cron job
3. URL: `https://yourdomain.com/api/email/process-queue`
4. Schedule: Every 2-5 minutes
5. Save and activate

**Option B: EasyCron (Free Tier)**
1. Sign up at https://www.easycron.com
2. Create a cron job
3. URL: `https://yourdomain.com/api/email/process-queue`
4. Schedule: `*/2 * * * *` (every 2 minutes)
5. Save

## Check if Emails Were Sent

1. Go to **Email Automation → Logs** in your dashboard
2. Check the "Sent" tab to see successfully sent emails
3. Check the "Queued" tab to see if any emails are still waiting

## Troubleshooting

**If emails show as "retried":**
- Check the error messages in the Email Logs page
- Common issues:
  - AWS SES not configured (check AWS credentials)
  - SES sandbox mode (verify recipient emails in AWS SES Console)
  - Sender email not verified (verify `support@clienova.com` in SES)

**If queue processor returns errors:**
- Check server logs for detailed error messages
- Verify AWS credentials are set in environment variables
- Ensure `support@clienova.com` is verified in AWS SES

## Next Steps

1. **For Now**: Manually call the endpoint to send queued emails
2. **For Production**: Deploy to Vercel or set up external cron service
3. **Check Logs**: Monitor Email Automation → Logs to see email status


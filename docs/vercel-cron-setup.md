# Vercel Cron Job Setup for Notifications

## Overview

This document explains how to set up and run the notification cron job on Vercel hosting.

## Cron Job Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-notifications",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Schedule Explanation

The schedule `"0 8 * * *"` runs the cron job once per day at:
- **8:00 AM UTC** - Daily notification check for all pending notifications

**Note**: This schedule is configured to run once per day to comply with Vercel Hobby plan limitations, which only allows daily cron jobs. For multiple daily runs, upgrade to Vercel Pro plan.

### Alternative Schedules

You can modify the schedule based on your needs:

- **Every hour**: `"0 * * * *"` (runs at the top of every hour)
- **Every 6 hours**: `"0 */6 * * *"` (runs at 12 AM, 6 AM, 12 PM, 6 PM)
- **Once daily at 8 AM**: `"0 8 * * *"`
- **Twice daily (8 AM and 8 PM)**: `"0 8,20 * * *"`

## Setting Up on Vercel

### Step 1: Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Deploy your project

### Step 2: Verify Cron Job Configuration

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. You should see the cron job listed with the schedule

### Step 3: Enable Cron Jobs (if needed)

- **Hobby Plan**: Supports daily cron jobs only (once per day)
- **Pro Plan and above**: Supports all cron job features including multiple daily runs
- Current configuration uses `"0 8 * * *"` to comply with Hobby plan limitations

### Step 4: Test the Cron Job

You can manually trigger the cron job to test it:

```bash
# Using curl
curl https://your-domain.vercel.app/api/cron/send-notifications

# Or visit in browser
https://your-domain.vercel.app/api/cron/send-notifications
```

## Notification Types Implemented

### 1. Same-Day Appointment Notifications
- **When**: Sent at 8:00 AM on the day of appointment
- **What**: Morning reminder for appointments scheduled that day

### 2. Appointment Reminders
- **When**: 1-24 hours before appointment, and 30 minutes before
- **What**: Reminder notifications for upcoming appointments

### 3. Plan Expiry Warnings
- **When**: 7 days, 3 days, 1 day before expiry, and on the last day
- **What**: Notifications about plan expiration

### 4. Plan Booking Window Notifications
- **When**: When booking window opens (5 days before consultation date)
- **What**: Notifications that the booking window is open for plan consultations

### 5. Consultation Reminders
- **When**: 3 days before consultation dates
- **What**: Reminders for upcoming consultations

### 6. Lab Results Ready
- **When**: When lab results are available
- **What**: Notifications about completed lab tests

### 7. Diet Plan Notifications
- **When**: When diet plans are created or requests are updated
- **What**: Notifications about diet plan status

## Monitoring Cron Jobs

### Vercel Dashboard
1. Go to your project dashboard
2. Navigate to **Deployments**
3. Check the **Functions** tab to see cron job executions
4. View logs for each execution

### Logs
Check Vercel function logs to see:
- Number of notifications sent
- Any errors that occurred
- Processing statistics

### Response Format
The cron job returns a JSON response:

```json
{
  "success": true,
  "message": "Scheduled notifications sent successfully",
  "processed": {
    "todayAppointments": 5,
    "activeSubscriptions": 10,
    "expiringSubscriptions": 2,
    "completedLabBookings": 3,
    "recentDietPlanRequests": 1,
    "recentDietPlans": 2
  }
}
```

## Troubleshooting

### Cron Job Not Running

1. **Check Vercel Plan**: Ensure you have a plan that supports cron jobs
2. **Verify vercel.json**: Make sure `vercel.json` is in the root directory
3. **Check Schedule**: Verify the cron schedule syntax is correct
4. **Deploy Again**: Sometimes a redeploy is needed for cron jobs to activate

### Notifications Not Sending

1. **Check Logs**: Review Vercel function logs for errors
2. **Verify Database**: Ensure database connection is working
3. **Check Device Tokens**: Verify patients have active device tokens
4. **Test Manually**: Trigger the endpoint manually to test

### Timezone Issues

- Vercel cron jobs run in UTC timezone
- Adjust your schedule accordingly (e.g., for IST, subtract 5:30 hours)
- Example: For 8 AM IST, use `"0 2,6,10,14 * * *"` (2:30 AM UTC = 8 AM IST)

## Best Practices

1. **Idempotency**: The cron job checks for existing notifications to avoid duplicates
2. **Error Handling**: All errors are caught and logged without stopping the entire job
3. **Performance**: Queries are optimized with proper indexes
4. **Monitoring**: Regular monitoring of logs and notification delivery rates

## Local Development

To test the cron job locally:

```bash
# Run the Next.js dev server
npm run dev

# Trigger the cron endpoint manually
curl http://localhost:3000/api/cron/send-notifications
```

## Security

The cron endpoint should be protected. Consider:

1. **Vercel Cron Secret**: Use Vercel's built-in cron secret verification
2. **API Key**: Add an API key check in the route handler
3. **IP Whitelist**: Restrict to Vercel's IP ranges (if using external triggers)

Example with secret verification:

```typescript
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of the code
}
```

Then in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-notifications",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Vercel automatically adds the `x-vercel-signature` header for cron jobs, which you can verify.

## Additional Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Schedule Syntax](https://crontab.guru/)
- [Vercel Function Logs](https://vercel.com/docs/observability/logs)

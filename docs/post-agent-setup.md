# X Posting Agent - Setup Guide

## Overview
This guide walks you through setting up the multi-tenant X (Twitter) daily posting agent.

## Prerequisites
- Supabase account (free tier works)
- X Developer Account with API access
- n8n instance (self-hosted or cloud)
- Node.js 18+ installed

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 1.2 Run Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Run the SQL script
4. Verify tables are created:
   - `startup_profiles`
   - `x_oauth_tokens`
   - `post_history`
   - `posting_schedule`

### 1.3 Configure Environment Variables
Add to your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 2: X API Setup

### 2.1 Create X Developer App
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a new app
3. Enable OAuth 2.0
4. Set callback URL: `https://your-domain.com/api/post-agent/x-callback`
5. Note your:
   - Client ID
   - Client Secret

### 2.2 Configure Environment Variables
Add to your `.env.local`:
```bash
X_CLIENT_ID=your-x-client-id
X_CLIENT_SECRET=your-x-client-secret
X_REDIRECT_URI=https://your-domain.com/api/post-agent/x-callback
```

## Step 3: n8n Setup

### 3.1 Install n8n
**Option A: Self-hosted (Docker)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option B: Cloud (n8n.io)**
- Sign up at [n8n.io](https://n8n.io)
- Create a new workflow

### 3.2 Import Workflow
1. Open n8n
2. Create new workflow
3. Follow the structure in `docs/n8n-workflow.md`
4. Configure nodes with your credentials

### 3.3 Configure Webhook
1. Create Webhook node
2. Copy the webhook URL
3. Add to your `.env.local`:
```bash
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/x-post-agent
```

## Step 4: Scheduler Setup

### Option A: Supabase Edge Function (Recommended)
1. Create Edge Function in Supabase Dashboard
2. Copy code from `app/api/post-agent/scheduler/route.ts`
3. Set up Supabase Cron:
   ```sql
   SELECT cron.schedule(
     'daily-post-scheduler',
     '0 9 * * *', -- 9 AM UTC daily
     $$
     SELECT net.http_post(
       url := 'https://your-domain.com/api/post-agent/scheduler',
       headers := '{"Authorization": "Bearer YOUR_SCHEDULER_SECRET"}'::jsonb
     ) AS request_id;
     $$
   );
   ```

### Option B: External Cron Service
1. Use [cron-job.org](https://cron-job.org) or similar
2. Set schedule: Daily at 9:00 AM UTC
3. URL: `https://your-domain.com/api/post-agent/scheduler`
4. Method: POST
5. Headers: `Authorization: Bearer YOUR_SCHEDULER_SECRET`

### Option C: Vercel Cron (if using Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/post-agent/scheduler",
    "schedule": "0 9 * * *"
  }]
}
```

### 4.1 Configure Scheduler Secret
Add to your `.env.local`:
```bash
SCHEDULER_SECRET=your-random-secret-string
```

## Step 5: LLM Setup

Choose one LLM provider:

### Option A: OpenAI
```bash
OPENAI_API_KEY=your-openai-key
```

### Option B: Anthropic
```bash
ANTHROPIC_API_KEY=your-anthropic-key
```

### Option C: Google AI
```bash
GOOGLE_AI_API_KEY=your-google-ai-key
```

## Step 6: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 7: Update API Routes

The API routes in `app/api/post-agent/` have TODO comments. You need to:

1. **Add Supabase Client**:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   ```

2. **Implement Auth Checks**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   ```

3. **Implement Database Operations**:
   - Replace mock responses with actual Supabase queries
   - Use service role key for n8n backend operations

## Step 8: Test the Flow

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Visit Post Agent Page**:
   ```
   http://localhost:3000/post-agent
   ```

3. **Connect X Account**:
   - Click "Connect X Account"
   - Authorize the app
   - Verify connection status

4. **Test Post**:
   - Click "Test Post Now"
   - Check your X account for the post
   - Verify post appears in history

5. **Test Scheduler**:
   - Manually call scheduler endpoint:
   ```bash
   curl -X POST https://your-domain.com/api/post-agent/scheduler \
     -H "Authorization: Bearer YOUR_SCHEDULER_SECRET"
   ```

## Troubleshooting

### X OAuth Issues
- Verify callback URL matches exactly
- Check client ID and secret are correct
- Ensure OAuth 2.0 is enabled in X app settings

### Database Issues
- Verify RLS policies are correct
- Check service role key has proper permissions
- Ensure foreign keys are set up correctly

### n8n Workflow Issues
- Check webhook URL is accessible
- Verify Supabase credentials in n8n
- Check LLM API key is valid
- Review n8n execution logs

### Scheduler Issues
- Verify scheduler secret matches
- Check cron job is running
- Test endpoint manually first
- Review server logs

## Security Notes

1. **Never commit** `.env.local` to git
2. **Use service role key** only in backend/n8n (never expose to frontend)
3. **Encrypt tokens** at rest (use Supabase Vault or pgcrypto)
4. **Validate user_id** in all API routes
5. **Rate limit** API endpoints
6. **Monitor** for suspicious activity

## Next Steps

- [ ] Set up production environment
- [ ] Configure monitoring and alerts
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Implement token refresh logic
- [ ] Add analytics dashboard
- [ ] Set up backup strategy

## Support

For issues or questions, refer to:
- `docs/n8n-workflow.md` - n8n workflow details
- `docs/ai-system-prompt.md` - AI prompt configuration
- `docs/free-first-architecture.md` - Architecture and limitations


# X Posting Agent

Multi-tenant daily X (Twitter) posting agent that works for many users.

## Features

- ✅ X OAuth 2.0 connection
- ✅ Encrypted token storage
- ✅ Daily automated posting
- ✅ AI-powered post generation
- ✅ Post history tracking
- ✅ Multi-tenant architecture
- ✅ Free-first MVP design

## Quick Start

1. **Set up Supabase** - See `docs/post-agent-setup.md`
2. **Configure X API** - Get OAuth credentials from Twitter Developer Portal
3. **Set up n8n** - Self-host or use cloud instance
4. **Install dependencies**:
   ```bash
   npm install @supabase/supabase-js
   ```
5. **Configure environment variables** (see setup guide)
6. **Run database schema** - Execute `supabase/schema.sql` in Supabase

## Architecture

```
User → Next.js App → Supabase (Auth + DB)
                    ↓
            Scheduler (Cron)
                    ↓
            n8n Workflow
                    ↓
            LLM → X API
```

## Files Structure

- `page.tsx` - Main UI component
- `app/api/post-agent/` - API routes:
  - `x-connect/` - OAuth initiation
  - `x-callback/` - OAuth callback
  - `x-status/` - Connection status
  - `x-disconnect/` - Disconnect account
  - `history/` - Post history
  - `profile/` - Startup profile
  - `test-post/` - Manual test post
  - `scheduler/` - Daily scheduler endpoint

## Documentation

- **Setup Guide**: `docs/post-agent-setup.md`
- **n8n Workflow**: `docs/n8n-workflow.md`
- **AI Prompt**: `docs/ai-system-prompt.md`
- **Architecture**: `docs/free-first-architecture.md`
- **Database Schema**: `supabase/schema.sql`

## Environment Variables

Required environment variables (see setup guide for details):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_REDIRECT_URI`
- `N8N_WEBHOOK_URL`
- `SCHEDULER_SECRET`
- LLM API key (OpenAI/Anthropic/Google)

## Usage

1. Navigate to `/post-agent`
2. Connect your X account via OAuth
3. Ensure your startup profile is complete
4. Posts will be generated and published daily at 9 AM
5. View post history on the same page

## Limitations (Free Tier)

- X API: 1,500 tweets/month (50 users max)
- Supabase: 500 MB database, 2 GB bandwidth
- One post per day per user
- Single timezone (UTC)

See `docs/free-first-architecture.md` for full details.

## Security

- Tokens encrypted at rest
- Row-level security (RLS) enabled
- Service role key only in backend
- OAuth 2.0 with PKCE
- Scheduler secret protection

## Support

For setup issues, see `docs/post-agent-setup.md` troubleshooting section.


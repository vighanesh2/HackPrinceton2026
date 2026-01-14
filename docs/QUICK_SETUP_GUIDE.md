# Quick Setup Guide - Getting Your URLs and Secrets

## 1. n8n Webhook URL

### Step-by-Step:

1. **Open your n8n instance** (self-hosted or cloud)

2. **Create a new workflow** or open existing one

3. **Add a Webhook node**:
   - Click "+" to add node
   - Search for "Webhook"
   - Select "Webhook" node

4. **Configure the Webhook node**:
   - **HTTP Method**: POST
   - **Path**: `/x-post-agent` (or any path you want)
   - **Response Mode**: "Respond to Webhook" (important!)
   - Click "Execute Node" to activate it

5. **Copy the Webhook URL**:
   - After executing, n8n will show you the webhook URL
   - It looks like: `https://your-n8n-instance.com/webhook/x-post-agent`
   - OR for local: `http://localhost:5678/webhook/x-post-agent`
   - OR for n8n cloud: `https://your-workspace.app.n8n.cloud/webhook/x-post-agent`

6. **Add to .env.local**:
   ```bash
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/x-post-agent
   ```

### Example URLs:
- **Self-hosted local**: `http://localhost:5678/webhook/x-post-agent`
- **Self-hosted production**: `https://n8n.yourdomain.com/webhook/x-post-agent`
- **n8n Cloud**: `https://your-workspace.app.n8n.cloud/webhook/x-post-agent`

---

## 2. X Redirect URI

This is **your app's URL** where X will redirect users after OAuth.

### Step-by-Step:

1. **Determine your app URL**:
   - **Local development**: `http://localhost:3000`
   - **Production**: `https://yourdomain.com`

2. **The redirect URI is always**:
   ```
   {YOUR_APP_URL}/api/post-agent/x-callback
   ```

3. **Examples**:
   - Local: `http://localhost:3000/api/post-agent/x-callback`
   - Production: `https://yourdomain.com/api/post-agent/x-callback`

4. **Set in X Developer Portal**:
   - Go to [developer.twitter.com](https://developer.twitter.com)
   - Open your app
   - Go to "User authentication settings"
   - Under "Callback URI / Redirect URL", add:
     ```
     http://localhost:3000/api/post-agent/x-callback
     ```
   - For production, also add:
     ```
     https://yourdomain.com/api/post-agent/x-callback
     ```
   - **Important**: The URL must match EXACTLY (including http vs https)

5. **Add to .env.local**:
   ```bash
   # For local development
   X_REDIRECT_URI=http://localhost:3000/api/post-agent/x-callback
   
   # OR for production
   X_REDIRECT_URI=https://yourdomain.com/api/post-agent/x-callback
   
   # Also set your base app URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   # OR
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

---

## 3. Scheduler Secret

This is just a **random secret string** to protect your scheduler endpoint.

### Step-by-Step:

1. **Generate a random string** (any method):
   - Use a password generator
   - Use this command: `openssl rand -hex 32`
   - Or just make one up: `my-super-secret-scheduler-key-2024-xyz123`
   - Minimum 32 characters recommended

2. **Examples**:
   ```bash
   SCHEDULER_SECRET=sk_live_abc123xyz789_random_secret_2024
   SCHEDULER_SECRET=my-scheduler-secret-key-min-32-chars-long
   SCHEDULER_SECRET=8f3a9b2c1d4e5f6a7b8c9d0e1f2a3b4c
   ```

3. **Add to .env.local**:
   ```bash
   SCHEDULER_SECRET=your-random-secret-string-here
   ```

4. **Use this same secret** when setting up your cron job (see scheduler setup below)

---

## 4. Using n8n Agent vs Regular Workflow

### Option A: n8n AI Agent (if you want AI-powered workflow)
- n8n has built-in AI agents that can make decisions
- You can use this, but you still need a webhook trigger
- The webhook URL setup is the same

### Option B: Regular n8n Workflow (Recommended for MVP)
- Simpler and more predictable
- Follow the workflow in `docs/n8n-workflow.md`
- Still uses webhook trigger

**Both work!** The webhook URL setup is identical.

---

## Complete .env.local Example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# X OAuth
X_CLIENT_ID=your_x_client_id_from_twitter
X_CLIENT_SECRET=your_x_client_secret_from_twitter
X_REDIRECT_URI=http://localhost:3000/api/post-agent/x-callback

# n8n Webhook (get this from n8n webhook node)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/x-post-agent

# Scheduler (any random string you make up)
SCHEDULER_SECRET=my-super-secret-scheduler-key-2024-xyz123

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# LLM (choose one)
OPENAI_API_KEY=sk-proj-...
```

---

## Quick Test Checklist

1. ✅ **n8n Webhook**: 
   - Create webhook node in n8n
   - Copy the URL it gives you
   - Test it: `curl -X POST http://localhost:5678/webhook/x-post-agent -d '{"test": true}'`

2. ✅ **X Redirect URI**:
   - Set in X Developer Portal
   - Must match exactly: `http://localhost:3000/api/post-agent/x-callback`
   - Test: Visit `/post-agent` page and click "Connect X Account"

3. ✅ **Scheduler Secret**:
   - Just make up a random string
   - Use same one in cron job setup
   - Test: `curl -X POST http://localhost:3000/api/post-agent/scheduler -H "Authorization: Bearer your-secret"`

---

## Troubleshooting

### n8n Webhook Not Working?
- Make sure webhook node is executed/activated
- Check the path matches exactly
- Verify n8n is accessible (not blocked by firewall)
- For local: Make sure n8n is running on port 5678

### X OAuth Redirect Error?
- URL must match EXACTLY (including http/https)
- Check for trailing slashes
- Make sure callback route exists: `/api/post-agent/x-callback`
- Wait a few minutes after updating X app settings

### Scheduler 401 Unauthorized?
- Make sure `SCHEDULER_SECRET` matches exactly
- Check Authorization header format: `Bearer {secret}`
- No extra spaces or quotes

---

## Next Steps

1. Set up n8n workflow following `docs/n8n-workflow.md`
2. Configure X OAuth in Twitter Developer Portal
3. Set up scheduler (cron job) - see `docs/post-agent-setup.md`
4. Test the full flow!


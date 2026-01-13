# Fix: X OAuth "Something went wrong" Error

## The Problem

You're seeing this error because the redirect URI is set to `https://your-domain.com` which is a **placeholder**, not a real domain. X rejects OAuth requests when the redirect URI doesn't match what's registered in your X Developer App.

## The Solution

### Step 1: Update Your .env.local File

Open your `.env.local` file and make sure you have these set correctly:

**For Local Development:**
```bash
X_REDIRECT_URI=http://localhost:3000/api/post-agent/x-callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
```bash
X_REDIRECT_URI=https://your-actual-domain.com/api/post-agent/x-callback
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
```

### Step 2: Update X Developer Portal

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Open your app
3. Go to **"User authentication settings"** or **"Settings" → "User authentication"**
4. Under **"Callback URI / Redirect URL"**, add:
   - For local: `http://localhost:3000/api/post-agent/x-callback`
   - For production: `https://your-actual-domain.com/api/post-agent/x-callback`
5. **Important**: The URL must match EXACTLY (including `http://` vs `https://`)
6. Click **"Save"**

### Step 3: Verify Your Settings

Check that these match EXACTLY:

✅ **In .env.local:**
```
X_REDIRECT_URI=http://localhost:3000/api/post-agent/x-callback
```

✅ **In X Developer Portal:**
```
http://localhost:3000/api/post-agent/x-callback
```

### Step 4: Restart Your Dev Server

After updating `.env.local`:
```bash
# Stop your server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Try Again

1. Go to `/post-agent` page
2. Click "Connect X Account"
3. It should work now!

## Common Issues

### Issue 1: "Invalid redirect_uri"
- **Cause**: URL doesn't match what's in X Developer Portal
- **Fix**: Make sure both URLs are identical (no trailing slashes, exact protocol)

### Issue 2: Still shows "your-domain.com"
- **Cause**: `.env.local` not loaded or server not restarted
- **Fix**: Restart your dev server after changing `.env.local`

### Issue 3: Works locally but not in production
- **Cause**: Production URL not added to X Developer Portal
- **Fix**: Add production URL to X app settings

## Quick Checklist

- [ ] `.env.local` has `X_REDIRECT_URI` set to actual URL (not placeholder)
- [ ] `.env.local` has `NEXT_PUBLIC_APP_URL` set correctly
- [ ] X Developer Portal has the exact same URL in callback settings
- [ ] Dev server restarted after changing `.env.local`
- [ ] URL matches exactly (http vs https, no trailing slashes)

## Example .env.local for Local Development

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# X OAuth - IMPORTANT: Use localhost for local dev
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=http://localhost:3000/api/post-agent/x-callback

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook/x-post-agent

# Scheduler
SCHEDULER_SECRET=your-random-secret

# LLM
OPENAI_API_KEY=sk-proj-...
```

## Still Not Working?

1. **Check browser console** for any errors
2. **Check server logs** for OAuth errors
3. **Verify X app settings**:
   - OAuth 2.0 is enabled
   - App type is set correctly
   - Callback URL is saved
4. **Wait a few minutes** after updating X app settings (can take time to propagate)

## Need Help?

If it's still not working, check:
- The exact error message in browser console
- Server terminal output
- X Developer Portal app settings screenshot


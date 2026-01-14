# Free-First Architecture & MVP Constraints

## What Works 100% Free

### Supabase (Free Tier)
- ✅ **Auth**: Unlimited users
- ✅ **Postgres Database**: 500 MB storage, 2 GB bandwidth
- ✅ **Row Level Security**: Included
- ✅ **Edge Functions**: 500K invocations/month
- ✅ **API**: Unlimited requests (within bandwidth limits)

**Limitations**:
- Database size: 500 MB (enough for ~10K users with minimal data)
- Bandwidth: 2 GB/month (monitor usage)
- Edge Functions: 500K/month (enough for daily cron if optimized)

### n8n (Self-Hosted)
- ✅ **Self-hosted**: Completely free (open source)
- ✅ **Unlimited workflows**: No restrictions
- ✅ **Unlimited executions**: No rate limits
- ✅ **All features**: Full access to all nodes

**Requirements**:
- Server/VPS to host (can use free tier: Railway, Render, Fly.io)
- Or run locally for development

### X API (Free Tier)
- ✅ **Essential Access**: Free tier available
- ✅ **Posting**: 1,500 tweets/month per app
- ✅ **Read**: Basic user info

**Limitations**:
- **Rate Limits**: 
  - Post Tweet: 300 per 3 hours (per user)
  - Read User: 75 per 15 minutes
- **Monthly Limit**: 1,500 tweets total per app
- **No Advanced Features**: No analytics, no advanced search

### LLM (Free/Cheap Options)
- ✅ **OpenAI**: $0.002 per 1K tokens (GPT-3.5-turbo)
- ✅ **Anthropic**: $0.003 per 1K tokens (Claude Haiku)
- ✅ **Google**: Free tier available (Gemini)
- ✅ **Ollama**: Completely free (self-hosted)

**Cost Estimate**: ~$0.001 per post (very cheap)

## MVP Shortcuts & Limitations

### 1. Draft-Only Mode (Free Testing)
**What**: Generate posts but don't actually post to X
- Skip X API call
- Save posts as drafts in database
- User can review and manually post
- **Benefit**: Test entire flow without X API limits

**Implementation**:
```typescript
// In n8n workflow, add flag
if (test_mode || draft_mode) {
  // Skip X API call
  // Save with status: 'draft'
}
```

### 2. Limited User Beta
**What**: Start with 10-50 users max
- Monitor costs and usage
- Validate product-market fit
- Iterate before scaling

**Why**:
- X API: 1,500 tweets/month = 50 users max (1 post/day)
- Supabase: 500 MB = ~10K users (but start small)
- n8n: No limits, but monitor server resources

### 3. Manual Token Refresh
**What**: Don't auto-refresh expired tokens initially
- User reconnects when token expires
- Simpler MVP (no refresh token flow)
- Add auto-refresh in v2

### 4. Single Timezone
**What**: All posts at 9 AM UTC (or one timezone)
- No per-user timezone initially
- Add timezone support later

### 5. No Post Scheduling Queue
**What**: Posts happen immediately when scheduled
- No queue for failed posts
- No retry logic initially
- Add in v2

## Cost Breakdown (100 Users)

### Supabase
- **Database**: ~50 MB (well under 500 MB limit)
- **Bandwidth**: ~100 MB/month (well under 2 GB)
- **Edge Functions**: ~3,000/month (well under 500K)
- **Cost**: $0/month (free tier)

### n8n
- **Hosting**: Free tier (Railway/Render) or $5-10/month VPS
- **Cost**: $0-10/month

### X API
- **Posts**: 3,000/month (100 users × 30 days)
- **Limit**: 1,500/month (FREE TIER LIMIT)
- **Solution**: 
  - Start with 50 users max
  - Or upgrade to Basic ($100/month) for 3,000 posts
- **Cost**: $0-100/month

### LLM
- **Posts**: 3,000/month
- **Tokens**: ~100 tokens/post = 300K tokens/month
- **Cost**: ~$0.60/month (GPT-3.5-turbo)

### Total MVP Cost
- **50 users**: $0-10/month (100% free tier)
- **100 users**: $100-110/month (X API upgrade needed)

## Scaling Path

### Phase 1: MVP (0-50 users)
- ✅ All free tiers
- ✅ Draft mode available
- ✅ Manual token refresh
- **Cost**: $0-10/month

### Phase 2: Growth (50-500 users)
- Upgrade X API to Basic ($100/month)
- Upgrade Supabase to Pro ($25/month) if needed
- Add auto token refresh
- **Cost**: $125-135/month

### Phase 3: Scale (500+ users)
- X API Pro tier ($5,000/month for 50K posts)
- Supabase Pro/Team
- Dedicated n8n server
- **Cost**: $5,000+/month

## Free Tier Monitoring

### Supabase
- Monitor database size: `SELECT pg_size_pretty(pg_database_size('postgres'));`
- Monitor bandwidth in dashboard
- Set up alerts for 80% usage

### X API
- Track monthly tweet count
- Monitor rate limits (300/3hrs per user)
- Implement rate limit handling

### n8n
- Monitor server CPU/memory
- Set up health checks
- Log execution times

## MVP Feature Checklist

### Must Have (v1)
- [x] X OAuth connection
- [x] Token storage (encrypted)
- [x] Daily scheduler
- [x] n8n workflow
- [x] AI post generation
- [x] Post to X
- [x] Post history

### Nice to Have (v2)
- [ ] Auto token refresh
- [ ] Per-user timezone
- [ ] Post queue/retry
- [ ] Analytics dashboard
- [ ] Post preview/edit
- [ ] Multiple post times

### Future (v3+)
- [ ] A/B testing posts
- [ ] Post performance analytics
- [ ] Content calendar
- [ ] Team collaboration

## Implementation Priority

1. **Week 1**: Supabase schema + OAuth flow
2. **Week 2**: n8n workflow + AI integration
3. **Week 3**: Scheduler + testing
4. **Week 4**: Polish + launch with 10 beta users

## Free Tier Gotchas

1. **X API**: 1,500 tweets/month is HARD limit (no overage)
2. **Supabase**: Database size includes indexes (monitor closely)
3. **n8n**: Self-hosted = you manage uptime
4. **LLM**: Free tiers have rate limits (implement retries)

## Recommendations

1. **Start with draft mode**: Test everything without X API limits
2. **Cap at 50 users initially**: Stay in free tier
3. **Monitor everything**: Set up alerts early
4. **Plan upgrade path**: Know when you'll hit limits
5. **Optimize early**: Database indexes, efficient queries


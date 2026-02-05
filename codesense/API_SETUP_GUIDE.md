# 🔐 GitHub & Gemini API Setup Guide

## Problem
You're hitting API rate limits:
- **GitHub API**: 60 requests/hour (unauthenticated) → 5,000 requests/hour (authenticated)
- **Gemini API**: Rate limiting on free tier

## Solution

### 1. Get a GitHub Personal Access Token (Recommended)

1. Go to https://github.com/settings/tokens/new
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: `CodeSense-Dev`
4. Select these scopes:
   - ✅ `public_repo` (read public repos)
   - ✅ `read:user` (read user profile)
5. Generate and copy the token
6. Add to `.env.local`:

```env
GEMINI_API_KEY=AIzaSyCGWCdm3B0bzp_Bj7jU3Yi2qI7nTY9WKCY
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Verify It Works

- GitHub will return rate limit info in response headers
- App will automatically use higher limits with token
- Diagrams are now cached to reduce redundant API calls

### 3. Check Rate Limits

In browser console or check logs:
```
[Cache HIT] Returning cached diagram for owner/repo/architecture
```

---

## API Rate Limit Status

### GitHub API
- **Without token**: 60 requests/hour
- **With token**: 5,000 requests/hour
- **Currently**: Using GitHub tree recursion (3 levels × multiple repos = high usage)

### Gemini API
- **Free tier**: ~15 requests/minute
- **Fallback**: Uses comprehensive default diagrams when rate-limited
- **Caching**: Saves successful diagrams to memory

---

## What To Do Now

1. **Option A**: Add GitHub token (recommended)
   - Go to https://github.com/settings/tokens/new
   - Create token, copy it
   - Add `GITHUB_TOKEN=xxx` to `.env.local`
   - Restart dev server

2. **Option B**: Use the app as-is
   - Default diagrams are comprehensive
   - Will use fallbacks when hitting limits
   - OK for testing with 1-2 repos

3. **Option C**: Implement caching layer
   - Store diagrams in database
   - Reduce API calls significantly
   - Best for production

---

## Environment Variables

```dotenv
# Required
GEMINI_API_KEY=AIzaSyCGWCdm3B0bzp_Bj7jU3Yi2qI7nTY9WKCY

# Optional (but recommended for development)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Testing

After setup, try:
1. Visit `/repo/vercel/next.js`
2. Check "Files" tab - should load faster
3. Check "Architecture" tab - should show cache hits in console
4. Ask a question in "Ask" tab - should use real code context

If you see: `[Cache HIT]` → GitHub token is working! ✅
If you see: `[Rate Limited]` → Fall back diagram is being used (still works!)


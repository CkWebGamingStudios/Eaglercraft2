# Cloudflare KV Cleanup Guide - Eaglercraft2

## Problem Identified

Your KV namespace `ELGE_USERS_KV` is accumulating **stale auth state entries** that never expire:

```
auth:state:537f83cf-c9e2-41d6-8e45-ec5ddd27de20
auth:state:a54d5dc5-9e9a-462b-9f7f-253a3fa55606
auth:state:aa5f6d45-2524-4bef-8d51-817701b4464e
```

These are created every time someone clicks "Sign in with Google/GitHub" but are **never cleaned up**, even after successful login.

---

## What Each Entry Type Is For

### ✅ **KEEP THESE** (Essential User Data)
- `17a8f960-6d32-4cea-bbe7-5cf72715a9cd` → User profile (Chhavik Agrawal)
- `auth:user:*` → Complete user profiles with bio, picture, etc.
- `auth:map:*` → Links OAuth provider IDs to your internal UIDs
- `auth:email:*` → Maps emails to UIDs for login lookup

### 🔄 **AUTO-EXPIRE THESE** (Temporary Session Data)
- `auth:session:*` → Active login sessions (should expire in 30 days)
- `auth:state:*` → CSRF tokens for OAuth flow (should expire in 10 minutes)

---

## The Fix

### 1. Update Auth Handler (Prevents Future Bloat)

Edit `functions/api/auth/[[path]].js`:

**Line ~162 - Add TTL to state entries:**
```javascript
// OLD (no expiration)
await adapter.put(`auth:state:${state}`, JSON.stringify({ provider, createdAt: Date.now() }));

// NEW (expires in 10 minutes)
await adapter.put(
  `auth:state:${state}`,
  JSON.stringify({ provider, createdAt: Date.now() }),
  { expirationTtl: 600 }  // 600 seconds = 10 minutes
);
```

**Line ~237 - Add TTL to session entries:**
```javascript
// OLD (no expiration)
await adapter.put(`auth:session:${sessionToken}`, JSON.stringify({ uid, createdAt: Date.now() }));

// NEW (expires in 30 days)
await adapter.put(
  `auth:session:${sessionToken}`,
  JSON.stringify({ uid, createdAt: Date.now() }),
  { expirationTtl: 2592000 }  // 2592000 seconds = 30 days
);
```

### 2. Update KV Adapter (Support TTL in API Mode)

If using Cloudflare API instead of native KV binding, update the `put` method around line ~75:

```javascript
async put(key, value, options = {}) {
  const url = `${valueBase}/${encodeURIComponent(key)}`;
  const headers = { ...authHeaders, "Content-Type": "text/plain" };
  
  // Add expiration if specified
  if (options.expirationTtl) {
    headers["Expiration-TTL"] = String(options.expirationTtl);
  }
  
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: value
  });
  
  if (!response.ok) throw new Error(`KV API put failed: ${response.status}`);
}
```

---

## Manual Cleanup (One-Time)

### Option 1: Cloudflare Dashboard (Safest)

1. Go to **Workers & Pages** → **KV** → **ELGE_USERS_KV**
2. Search for keys: `auth:state:`
3. Delete each one manually (they're all garbage)

### Option 2: Wrangler CLI (Faster)

```bash
# List all state keys
npx wrangler kv:key list --binding ELGE_USERS_KV --prefix "auth:state:"

# Delete them one by one (Cloudflare doesn't support bulk delete)
npx wrangler kv:key delete --binding ELGE_USERS_KV "auth:state:537f83cf-c9e2-41d6-8e45-ec5ddd27de20"
npx wrangler kv:key delete --binding ELGE_USERS_KV "auth:state:a54d5dc5-9e9a-462b-9f7f-253a3fa55606"
# ... repeat for each key
```

### Option 3: Create Cleanup Script (Advanced)

Create `scripts/cleanup-kv.js`:

```javascript
// This uses your admin endpoint to list and delete old state keys
async function cleanup() {
  const response = await fetch('https://eaglercraft2ck.pages.dev/api/admin/cleanup-states', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_ADMIN_TOKEN' }
  });
  console.log(await response.json());
}

cleanup();
```

---

## Expected KV Usage After Fix

### Before Fix (Current State)
- **~29 entries** → Growing with every login attempt
- **3+ stale state entries** that never expire
- Sessions never expire (people logged in forever)

### After Fix (Optimized)
- **~15 entries** → Only active users and their data
- State entries **auto-delete after 10 minutes**
- Sessions **auto-expire after 30 days** of inactivity
- KV stays under 100 entries even with 50 active users

---

## Monitoring KV Health

Add this to your admin panel (`src/pages/AdminPanel.jsx`):

```javascript
async function getKVStats() {
  const stats = await api('/kv-stats');
  return {
    totalKeys: stats.total,
    stateKeys: stats.state,  // Should be 0 or very low
    sessionKeys: stats.sessions,
    userKeys: stats.users
  };
}
```

---

## Why This Matters

1. **Cloudflare KV Free Tier Limits:**
   - 1,000 write ops/day
   - 100,000 read ops/day
   - Creating 100+ stale entries wastes your quota

2. **Performance:**
   - More entries = slower list operations
   - Affects admin panel load times

3. **Debugging:**
   - Clean KV makes it easier to spot real issues
   - Reduces noise when troubleshooting auth problems

---

## Deploy the Fix

```bash
git add functions/api/auth/[[path]].js
git commit -m "fix: add TTL to auth state and session entries to prevent KV bloat"
git push origin main
```

Cloudflare Pages will auto-deploy in ~2 minutes.

---

## Verify It Worked

After deployment:

1. **Test login flow:**
   - Click "Sign in with Google"
   - Wait 15 minutes
   - Check KV → `auth:state:*` entries should be gone

2. **Check session expiry:**
   - New sessions will show up with metadata
   - They'll auto-delete after 30 days of inactivity

3. **Monitor KV growth:**
   - Should stabilize at ~15-20 entries
   - Only grows when new users register

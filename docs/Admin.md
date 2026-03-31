# Error Log Explorer for Cloudflare Pages

This system provides free error tracking using Cloudflare Ray IDs and KV storage.

## 📋 Features

- ✅ **Automatic error capture** with Ray ID tracking
- ✅ **Slow request monitoring** (requests > 5 seconds)
- ✅ **Admin dashboard** for viewing and searching logs
- ✅ **7-day log retention** (auto-delete to save KV space)
- ✅ **Detailed error information**: stack traces, IP, country, user agent
- ✅ **Search and filter** by Ray ID, path, or message
- ✅ **Statistics dashboard** showing error counts and types

## 🚀 Setup Instructions

### 1. Create KV Namespace

First, create a KV namespace for storing error logs:

```bash
npx wrangler kv:namespace create ERROR_LOGS
```

This will output something like:
```
{ binding = "ERROR_LOGS", id = "abc123..." }
```

### 2. Update wrangler.toml

Add the KV binding to your `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "ERROR_LOGS"
id = "your-kv-namespace-id-here"
```

**Note:** If you don't want to create a separate KV namespace, the system will fall back to using your existing `ELGE_USERS_KV` namespace. Just skip this step if you prefer.

### 3. Deploy the Files

Copy these files to your Cloudflare Pages project:

```
eaglercraft2/
├── functions/
│   ├── _middleware.js          (Updated - error capture)
│   └── api/
│       └── admin/
│           └── [[path]].js     (Updated - added log routes)
└── admin-log-explorer.html     (New - dashboard UI)
```

### 4. Deploy to Cloudflare Pages

```bash
git add .
git commit -m "Add error log explorer"
git push
```

Or if using direct upload:
```bash
npx wrangler pages deploy
```

## 📖 API Routes

The following routes are now available in your admin panel:

### Get All Logs
```
GET /api/admin/logs?limit=50&cursor=xyz
```

### Get Specific Log by Ray ID
```
GET /api/admin/logs/{rayId}
```

### Delete Specific Log
```
DELETE /api/admin/logs/{rayId}
```

### Clear All Logs
```
DELETE /api/admin/logs
```

### Get Statistics
```
GET /api/admin/logs/stats
```

## 🎨 Using the Dashboard

1. **Access the dashboard**: Navigate to `/admin-log-explorer.html` on your deployed site
2. **Login**: Use your existing admin credentials (same as your admin panel)
3. **View logs**: All errors are displayed with Ray IDs, timestamps, and details
4. **Search**: Use the search box to filter by Ray ID, path, or error message
5. **View details**: Click any log entry to see full stack trace and metadata
6. **Delete**: Remove individual logs or clear all logs at once

## 🔍 What Gets Logged

### Errors (500 responses)
- Ray ID
- Error message and stack trace
- Request path and method
- IP address and country
- User agent
- Referer
- Request duration
- Timestamp

### Slow Requests (> 5 seconds)
- Ray ID
- Request duration
- Path and method
- Response status
- Timestamp

## 💾 Storage Limits

Using Cloudflare KV Free Tier:
- **1,000 write operations/day** (plenty for error logging)
- **100,000 read operations/day**
- **1 GB storage**
- **Logs auto-delete after 7 days** to save space

## 🛠️ Customization

### Change Log Retention Period

Edit `functions/_middleware.js`:

```javascript
expirationTtl: 60 * 60 * 24 * 30 // 30 days instead of 7
```

### Adjust Slow Request Threshold

Edit `functions/_middleware.js`:

```javascript
if (duration > 3000) { // 3 seconds instead of 5
```

### Disable Slow Request Logging

Remove this section from `functions/_middleware.js`:

```javascript
if (duration > 5000) {
  // ... remove this entire block
}
```

## 🐛 Troubleshooting

### "ERROR_LOGS KV not bound" error
- Make sure you created the KV namespace and added it to `wrangler.toml`
- Or the system will use your existing `ELGE_USERS_KV` namespace

### Logs not appearing
- Check that `_middleware.js` is in the `functions/` directory
- Verify the KV binding name matches in both files
- Check browser console for any JavaScript errors

### Dashboard not loading
- Ensure you're logged in to the admin panel first
- Check that `/api/admin/logs` returns data when accessed directly

## 📊 Alternative: External Logging

If you prefer to send logs to an external service instead of KV, you can modify the `logErrorToKV` function in `_middleware.js`:

### Send to Discord Webhook
```javascript
async function logErrorToKV(errorLog, env) {
  if (env.DISCORD_WEBHOOK_URL) {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 Error on ${errorLog.path}`,
        embeds: [{
          title: errorLog.message,
          description: `Ray ID: ${errorLog.rayId}`,
          color: 15158332,
          fields: [
            { name: 'Path', value: errorLog.path },
            { name: 'Timestamp', value: errorLog.timestamp }
          ]
        }]
      })
    });
  }
}
```

### Send to Axiom/OpenObserve
```javascript
async function logErrorToKV(errorLog, env) {
  if (env.AXIOM_API_URL && env.AXIOM_API_TOKEN) {
    await fetch(env.AXIOM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AXIOM_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([errorLog])
    });
  }
}
```

## 🎯 Next Steps

- Set up alerts for critical errors (Discord/Slack webhooks)
- Add custom error pages with Ray ID display
- Integrate with monitoring tools
- Add filtering by error type or time range
- Export logs for analysis

## 📝 License

Free to use and modify for your Eaglercraft project!

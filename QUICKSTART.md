# Quick Start Guide - Signal with Workers AI

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start the Cloudflare Worker

In your first terminal:

```bash
npm run dev:worker
```

The Worker will start on `http://localhost:8787`

**Note**: Make sure you have:
- A Cloudflare account
- Workers AI enabled in your Cloudflare dashboard
- Wrangler authenticated: `wrangler login`

## Step 3: Start the React Dashboard

In a second terminal:

```bash
npm run dev:app
# or
npm run dev
```

The dashboard will start on `http://localhost:5173`

## Step 4: Test AI Analysis

1. Open `http://localhost:5173` in your browser
2. Navigate to the Feed view
3. Click "Analyze with AI" on any feedback ticket
4. View the AI-generated analysis including:
   - Sentiment (positive/negative/neutral)
   - Theme/category
   - Priority assessment
   - Suggested tags
   - Key points
   - Summary

## Troubleshooting

### Worker not responding?

- Check that the Worker is running on port 8787
- Verify Workers AI is enabled in your Cloudflare account
- Check browser console for CORS errors

### AI analysis fails?

- Ensure Workers AI binding is configured in `wrangler.jsonc`
- Verify you're authenticated with Cloudflare: `wrangler login`
- Check Worker logs for error messages

### React app can't connect to Worker?

- Verify Worker URL in `src/services/api.js` (default: `http://localhost:8787`)
- Create `.env` file with: `VITE_WORKER_URL=http://localhost:8787`
- Restart the React dev server after changing environment variables

## Deploy to Production

1. Deploy the Worker:
```bash
npm run deploy
```

2. Update environment variable:
```bash
# Set VITE_WORKER_URL to your deployed Worker URL
echo "VITE_WORKER_URL=https://your-worker.your-subdomain.workers.dev" > .env
```

3. Build and deploy the React app (to Cloudflare Pages, Vercel, etc.)


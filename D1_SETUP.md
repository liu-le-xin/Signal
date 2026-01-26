# D1 Database Setup Guide

This guide will help you set up Cloudflare D1 to store and retrieve analyzed feedbacks.

## Step 1: Create D1 Database

Run the following command to create a D1 database:

```bash
npx wrangler d1 create cloudflare-signal-db
```

This will output something like:
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "cloudflare-signal-db",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

## Step 2: Update wrangler.jsonc

Copy the `database_id` from the output above and update `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "cloudflare-signal-db",
    "database_id": "YOUR_DATABASE_ID_HERE"  // Replace with actual ID
  }
]
```

## Step 3: Initialize Database Schema

Run the schema file to create the tables:

```bash
# For local development
npx wrangler d1 execute cloudflare-signal-db --local --file=./schema.sql

# For production (after deploying)
npx wrangler d1 execute cloudflare-signal-db --remote --file=./schema.sql
```

## Step 4: Verify Setup

1. Start your Worker:
   ```bash
   npm run dev:worker
   ```

2. Send some test feedbacks using the mock ingestor:
   ```bash
   npm run ingest
   ```

3. Check that feedbacks are stored:
   ```bash
   npx wrangler d1 execute cloudflare-signal-db --local --command="SELECT COUNT(*) as count FROM feedbacks"
   ```

## Step 5: Access Feedbacks in Dashboard

The Feed component will automatically fetch feedbacks from D1 when you load the dashboard. You can:

- View all feedbacks organized by theme
- Download feedbacks as TXT files using the download buttons
- Filter by theme or type (bug/feedback)

## Troubleshooting

### Database not found
- Make sure you've created the database and updated `wrangler.jsonc` with the correct `database_id`
- Verify the database name matches: `cloudflare-signal-db`

### Schema errors
- Make sure you've run the schema.sql file
- Check that all tables were created: `npx wrangler d1 execute cloudflare-signal-db --local --command="SELECT name FROM sqlite_master WHERE type='table'"`

### Data not appearing
- Check Worker logs for errors
- Verify the D1 binding is working: Check that `env.DB` is available in your Worker
- Try querying directly: `npx wrangler d1 execute cloudflare-signal-db --local --command="SELECT * FROM feedbacks LIMIT 5"`

## Reference

- [Cloudflare D1 Getting Started](https://developers.cloudflare.com/d1/get-started/)
- [D1 Worker API](https://developers.cloudflare.com/d1/worker-api/)


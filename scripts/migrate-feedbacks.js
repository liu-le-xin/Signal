/**
 * Migrate feedbacks from one Signal Worker (source) to another (target).
 * Use when the new frontend (e.g. signalplatform.pages.dev) uses a different
 * Worker with an empty D1 and you want to copy all tickets/analysis from the
 * old deployment (e.g. cloudflare-signal.pages.dev).
 *
 * Usage:
 *   SOURCE_WORKER_URL=https://old-worker.xxx.workers.dev \
 *   TARGET_WORKER_URL=https://new-worker.xxx.workers.dev \
 *   node scripts/migrate-feedbacks.js
 *
 * If both frontends use the SAME Worker, you don't need this script: just set
 * VITE_WORKER_URL on the new Pages project to that Worker URL and redeploy.
 */

const SOURCE = process.env.SOURCE_WORKER_URL;
const TARGET = process.env.TARGET_WORKER_URL;

if (!SOURCE || !TARGET) {
  console.error('Usage: SOURCE_WORKER_URL=... TARGET_WORKER_URL=... node scripts/migrate-feedbacks.js');
  process.exit(1);
}

async function run() {
  console.log('Fetching all feedbacks from source...');
  const listUrl = `${SOURCE.replace(/\/$/, '')}/api/feedbacks?limit=10000`;
  const listRes = await fetch(listUrl);
  if (!listRes.ok) {
    const text = await listRes.text();
    throw new Error(`Source GET /api/feedbacks failed: ${listRes.status} ${text}`);
  }
  const { feedbacks } = await listRes.json();
  if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
    console.log('No feedbacks to migrate.');
    return;
  }
  console.log(`Found ${feedbacks.length} feedback(s). Importing into target...`);
  const importUrl = `${TARGET.replace(/\/$/, '')}/api/feedbacks/import`;
  const importRes = await fetch(importUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedbacks }),
  });
  if (!importRes.ok) {
    const text = await importRes.text();
    throw new Error(`Target POST /api/feedbacks/import failed: ${importRes.status} ${text}`);
  }
  const result = await importRes.json();
  console.log(`Done. Imported ${result.imported} / ${result.total} feedbacks.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

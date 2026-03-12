/**
 * HexShare — Cleanup cron job
 *
 * Deletes all hexshare/ blobs whose expiresAt timestamp has passed.
 * Called automatically by Vercel Cron (see vercel.json).
 *
 * Security: Vercel injects `Authorization: Bearer <CRON_SECRET>` on every
 * cron invocation. Set CRON_SECRET in your Vercel project environment variables.
 */

import { list, del } from "@vercel/blob";

const BLOB_PREFIX = "hexshare/";

export default async function handler(req, res) {
  // Only allow GET (Vercel Cron uses GET)
  if (req.method !== "GET") return res.status(405).end();

  // Verify cron secret so the endpoint can't be called by anyone externally
  const authHeader = req.headers["authorization"];
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "BLOB_READ_WRITE_TOKEN not set." });
  }

  try {
    let cursor;
    let deleted = 0;
    let scanned = 0;
    const now = Date.now();

    // Page through all hexshare/ blobs
    do {
      const result = await list({
        prefix: BLOB_PREFIX,
        cursor,
        limit: 100,
      });

      for (const blob of result.blobs) {
        scanned++;
        try {
          const blobRes = await fetch(blob.url);
          if (!blobRes.ok) {
            // Unreadable blob — delete it
            await del(blob.url);
            deleted++;
            continue;
          }
          const { expiresAt } = await blobRes.json();
          if (!expiresAt || now > expiresAt) {
            await del(blob.url);
            deleted++;
          }
        } catch {
          // If we can't parse it, delete it to be safe
          await del(blob.url).catch(() => {});
          deleted++;
        }
      }

      cursor = result.cursor;
    } while (cursor);

    console.log(`[cleanup] scanned=${scanned} deleted=${deleted}`);
    return res.status(200).json({ scanned, deleted });
  } catch (err) {
    console.error("[cleanup] error:", err);
    return res.status(500).json({ error: err.message });
  }
}

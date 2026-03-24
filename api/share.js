/**
 * HexShare — Ephemeral catalog relay (Vercel Blob)
 *
 * Setup (one-time, ~1 minute, all within Vercel — no external account needed):
 *   1. Vercel Dashboard → your project → Storage → Create → Blob → Connect to project
 *   2. Push any commit — Vercel auto-injects BLOB_READ_WRITE_TOKEN into your env
 *   Done.
 */

import { put, del, list } from "@vercel/blob";
import { randomBytes } from "node:crypto";

const MAX_TTL = 600; // 10 minutes in seconds
const BLOB_PREFIX = "hexshare/";
const ALLOWED_ORIGIN = "https://hexlearn.eddy.rip";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  // ── POST /api/share — store catalog ──────────────────────────────
  if (req.method === "POST") {
    const { catalog, ttl } = req.body ?? {};

    if (
      !catalog ||
      typeof catalog !== "object" ||
      Array.isArray(catalog) ||
      !Array.isArray(catalog.questions ?? catalog)
    ) {
      return res.status(400).json({ error: "Ungültiger Katalog." });
    }

    const safeTtl = Math.max(
      60,
      Math.min(MAX_TTL, Math.round(Number(ttl) || 300)),
    );
    const id = randomBytes(4).toString("hex");
    const expiresAt = Date.now() + safeTtl * 1000;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set.");
      return res
        .status(503)
        .json({
          error:
            "Serverkonfiguration fehlt (BLOB_READ_WRITE_TOKEN). Bitte Vercel-Projekt neu deployen.",
        });
    }

    try {
      await put(`${BLOB_PREFIX}${id}`, JSON.stringify({ catalog, expiresAt }), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      });
    } catch (err) {
      console.error("Blob PUT error:", err);
      return res.status(503).json({ error: `Speicherfehler: ${err.message}` });
    }

    return res.status(200).json({ id, ttl: safeTtl });
  }

  // ── GET /api/share?id=<id> — retrieve catalog ────────────────────
  if (req.method === "GET") {
    const { id } = req.query;

    if (!id || typeof id !== "string" || !/^[0-9a-f]{8}$/.test(id)) {
      return res.status(400).json({ error: "Ungültige ID." });
    }

    try {
      const { blobs } = await list({ prefix: `${BLOB_PREFIX}${id}` });

      if (blobs.length === 0) {
        return res
          .status(404)
          .json({ error: "QR-Code nicht gefunden oder abgelaufen." });
      }

      const blobRes = await fetch(blobs[0].url);
      if (!blobRes.ok) throw new Error("Blob konnte nicht gelesen werden.");

      const { catalog, expiresAt } = await blobRes.json();

      if (Date.now() > expiresAt) {
        del(blobs[0].url).catch(() => {}); // async cleanup, don't await
        return res
          .status(404)
          .json({ error: "Dieser QR-Code ist abgelaufen." });
      }

      return res.status(200).json({ catalog });
    } catch (err) {
      console.error("Blob GET error:", err);
      return res
        .status(503)
        .json({ error: "Serverfehler. Bitte erneut versuchen." });
    }
  }

  res.status(405).end();
}

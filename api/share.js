import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const SHARE_DIR = "/tmp/hexlearn-shares";
const MAX_TTL_MS = 10 * 60 * 1000;
const ID_REGEX = /^[a-f0-9]{8}$/;

async function ensureDir() {
  await fs.mkdir(SHARE_DIR, { recursive: true });
}

async function cleanExpired() {
  try {
    const files = await fs.readdir(SHARE_DIR);
    const now = Date.now();
    await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.join(SHARE_DIR, file);
          const raw = await fs.readFile(filePath, "utf8");
          const { expiresAt } = JSON.parse(raw);
          if (now > expiresAt) await fs.unlink(filePath);
        } catch {
          /* skip */
        }
      }),
    );
  } catch {
    /* directory may not exist yet */
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://hexlearn.eddy.rip");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  await ensureDir();
  await cleanExpired();

  // ── POST /api/share  ─────────────────────────────────────────────────
  if (req.method === "POST") {
    const { catalog, ttlMinutes } = req.body ?? {};

    if (
      !catalog ||
      typeof catalog.name !== "string" ||
      !Array.isArray(catalog.questions) ||
      catalog.questions.length === 0
    ) {
      return res.status(400).json({ error: "Ungültiger Katalog." });
    }

    const ttl = Math.min(
      Math.max(1, Number(ttlMinutes) || 10) * 60_000,
      MAX_TTL_MS,
    );
    const id = crypto.randomBytes(4).toString("hex");
    const expiresAt = Date.now() + ttl;

    await fs.writeFile(
      path.join(SHARE_DIR, `${id}.json`),
      JSON.stringify({ catalog, expiresAt }),
      "utf8",
    );

    return res.status(200).json({ id, expiresAt });
  }

  // ── GET /api/share?id=XXXXXXXX  ──────────────────────────────────────
  if (req.method === "GET") {
    const id = String(req.query?.id ?? "");
    if (!ID_REGEX.test(id)) {
      return res.status(400).json({ error: "Ungültige ID." });
    }

    try {
      const raw = await fs.readFile(path.join(SHARE_DIR, `${id}.json`), "utf8");
      const { catalog, expiresAt } = JSON.parse(raw);

      if (Date.now() > expiresAt) {
        await fs.unlink(path.join(SHARE_DIR, `${id}.json`)).catch(() => {});
        return res.status(404).json({ error: "Share abgelaufen." });
      }

      return res.status(200).json({ catalog, expiresAt });
    } catch {
      return res.status(404).json({ error: "Share nicht gefunden." });
    }
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { path: filePath } = req.query;
  if (!filePath || typeof filePath !== "string") {
    return res.status(400).json({ error: "path query param required" });
  }

  // Security: only allow paths under ./sessions
  const resolved = path.resolve(filePath);
  const allowedBase = path.resolve("./sessions");

  if (!resolved.startsWith(allowedBase)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const buffer = fs.readFileSync(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };

    res.setHeader("Content-Type", mimeTypes[ext] ?? "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch {
    return res.status(404).json({ error: "Screenshot not found" });
  }
}

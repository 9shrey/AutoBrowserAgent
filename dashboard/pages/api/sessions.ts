import type { NextApiRequest, NextApiResponse } from "next";
import { listSessions, loadSession, deleteSession } from "../../../recorder/session-store.js";

const SESSION_DIR = process.env.SESSION_DIR ?? "./sessions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case "GET": {
        const { id } = req.query;

        if (id && typeof id === "string") {
          const session = await loadSession(SESSION_DIR, id);
          if (!session) return res.status(404).json({ error: "Session not found" });
          return res.status(200).json(session);
        }

        const sessions = await listSessions(SESSION_DIR);
        return res.status(200).json(sessions);
      }

      case "DELETE": {
        const { id } = req.query;
        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Session ID required" });
        }
        const deleted = await deleteSession(SESSION_DIR, id);
        return res.status(deleted ? 200 : 404).json({ deleted });
      }

      default:
        res.setHeader("Allow", ["GET", "DELETE"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

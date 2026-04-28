import type { NextApiRequest, NextApiResponse } from "next";
import type { InterventionCommand } from "../../../shared/types.js";

// In-memory intervention queue (in production, use Redis or a message broker)
const interventionQueue = new Map<string, { command: InterventionCommand; message?: string }>();

export function getIntervention(sessionId: string) {
  const entry = interventionQueue.get(sessionId);
  if (entry) {
    interventionQueue.delete(sessionId);
    return entry;
  }
  return null;
}

export function hasIntervention(sessionId: string): boolean {
  return interventionQueue.has(sessionId);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { sessionId, command, message } = req.body as {
      sessionId: string;
      command: InterventionCommand;
      message?: string;
    };

    if (!sessionId || !command) {
      return res.status(400).json({ error: "sessionId and command required" });
    }

    const validCommands: InterventionCommand[] = ["pause", "redirect", "resume", "takeover"];
    if (!validCommands.includes(command)) {
      return res.status(400).json({ error: `Invalid command: ${command}` });
    }

    interventionQueue.set(sessionId, { command, message });
    console.log(`[Intervene] ${sessionId}: ${command}${message ? ` - ${message}` : ""}`);

    return res.status(200).json({ ok: true, command, message });
  }

  if (req.method === "GET") {
    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId required" });
    }

    const entry = interventionQueue.get(sessionId);
    if (entry) {
      interventionQueue.delete(sessionId);
      return res.status(200).json(entry);
    }

    return res.status(200).json(null);
  }

  res.setHeader("Allow", ["POST", "GET"]);
  return res.status(405).json({ error: "Method not allowed" });
}

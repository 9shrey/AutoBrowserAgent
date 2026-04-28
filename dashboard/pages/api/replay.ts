import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const SESSION_DIR = process.env.SESSION_DIR ?? "./sessions";

/**
 * SSE endpoint for live replay streaming.
 * Client connects to GET /api/replay?sessionId=... with Accept: text/event-stream
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const { sessionId } = req.query;
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "sessionId required" });
  }

  // Check if client wants SSE
  const accept = req.headers.accept ?? "";
  if (!accept.includes("text/event-stream")) {
    // Return current state as regular JSON
    return res.status(200).json({ sessionId, message: "Use Accept: text/event-stream for live replay" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sessionPath = path.join(SESSION_DIR, sessionId);
  const actionsFile = path.join(sessionPath, "actions.jsonl");
  const thoughtsFile = path.join(sessionPath, "thoughts.jsonl");

  const sendSSE = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendSSE("connected", { sessionId });

  // Watch files for changes
  let lastActionsSize = 0;
  let lastThoughtsSize = 0;

  try {
    lastActionsSize = fs.existsSync(actionsFile) ? fs.statSync(actionsFile).size : 0;
    lastThoughtsSize = fs.existsSync(thoughtsFile) ? fs.statSync(thoughtsFile).size : 0;
  } catch {
    // Files don't exist yet
  }

  // Poll for changes every second
  const interval = setInterval(() => {
    try {
      // Check actions file
      if (fs.existsSync(actionsFile)) {
        const size = fs.statSync(actionsFile).size;
        if (size > lastActionsSize) {
          // Read new lines
          const stream = fs.createReadStream(actionsFile, {
            start: lastActionsSize,
            encoding: "utf-8",
          });
          let data = "";
          stream.on("data", (chunk: string) => (data += chunk));
          stream.on("end", () => {
            for (const line of data.trim().split("\n")) {
              if (line.trim()) {
                try {
                  sendSSE("action", JSON.parse(line));
                } catch { /* skip malformed */ }
              }
            }
          });
          lastActionsSize = size;
        }
      }

      // Check thoughts file
      if (fs.existsSync(thoughtsFile)) {
        const size = fs.statSync(thoughtsFile).size;
        if (size > lastThoughtsSize) {
          const stream = fs.createReadStream(thoughtsFile, {
            start: lastThoughtsSize,
            encoding: "utf-8",
          });
          let data = "";
          stream.on("data", (chunk: string) => (data += chunk));
          stream.on("end", () => {
            for (const line of data.trim().split("\n")) {
              if (line.trim()) {
                try {
                  sendSSE("thought", JSON.parse(line));
                } catch { /* skip malformed */ }
              }
            }
          });
          lastThoughtsSize = size;
        }
      }
    } catch {
      // Session may have been removed
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  // Send initial data
  sendSSE("init", { sessionId });

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
}

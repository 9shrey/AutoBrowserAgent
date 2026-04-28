import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const SESSION_DIR = process.env.SESSION_DIR ?? "./sessions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const { sessionId } = req.query;
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "sessionId required" });
  }

  const accept = req.headers.accept ?? "";
  if (!accept.includes("text/event-stream")) {
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

  let lastActionsSize = 0;
  let lastThoughtsSize = 0;
  try {
    lastActionsSize = fs.existsSync(actionsFile) ? fs.statSync(actionsFile).size : 0;
    lastThoughtsSize = fs.existsSync(thoughtsFile) ? fs.statSync(thoughtsFile).size : 0;
  } catch { /* files don't exist yet */ }

  const interval = setInterval(() => {
    try {
      if (fs.existsSync(actionsFile)) {
        const size = fs.statSync(actionsFile).size;
        if (size > lastActionsSize) {
          const stream = fs.createReadStream(actionsFile, { start: lastActionsSize, encoding: "utf-8" });
          let data = "";
          stream.on("data", (chunk: string) => (data += chunk));
          stream.on("end", () => {
            for (const line of data.trim().split("\n")) {
              if (line.trim()) {
                try { sendSSE("action", JSON.parse(line)); } catch { /* skip */ }
              }
            }
          });
          lastActionsSize = size;
        }
      }
      if (fs.existsSync(thoughtsFile)) {
        const size = fs.statSync(thoughtsFile).size;
        if (size > lastThoughtsSize) {
          const stream = fs.createReadStream(thoughtsFile, { start: lastThoughtsSize, encoding: "utf-8" });
          let data = "";
          stream.on("data", (chunk: string) => (data += chunk));
          stream.on("end", () => {
            for (const line of data.trim().split("\n")) {
              if (line.trim()) {
                try { sendSSE("thought", JSON.parse(line)); } catch { /* skip */ }
              }
            }
          });
          lastThoughtsSize = size;
        }
      }
    } catch { clearInterval(interval); res.end(); }
  }, 1000);

  sendSSE("init", { sessionId });
  req.on("close", () => { clearInterval(interval); res.end(); });
}

import fs from "fs/promises";
import path from "path";
import type { SessionManifest, Frame, Thought, ActionResult, SessionData } from "./types";

export async function listSessions(sessionDir: string): Promise<SessionManifest[]> {
  const manifests: SessionManifest[] = [];
  try {
    const entries = await fs.readdir(sessionDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(sessionDir, entry.name, "manifest.json");
      try {
        const raw = await fs.readFile(manifestPath, "utf-8");
        manifests.push(JSON.parse(raw) as SessionManifest);
      } catch { /* skip */ }
    }
  } catch { /* dir doesn't exist */ }
  return manifests.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export async function loadSession(sessionDir: string, sessionId: string): Promise<SessionData | null> {
  const fullPath = path.join(sessionDir, sessionId);
  try {
    const manifestRaw = await fs.readFile(path.join(fullPath, "manifest.json"), "utf-8");
    const manifest = JSON.parse(manifestRaw) as SessionManifest;

    const thoughts: Thought[] = [];
    const thoughtsPath = path.join(fullPath, "thoughts.jsonl");
    try {
      const thoughtsRaw = await fs.readFile(thoughtsPath, "utf-8");
      for (const line of thoughtsRaw.trim().split("\n")) {
        if (line.trim()) thoughts.push(JSON.parse(line));
      }
    } catch { /* no thoughts file */ }

    const actions: ActionResult[] = [];
    const actionsPath = path.join(fullPath, "actions.jsonl");
    try {
      const actionsRaw = await fs.readFile(actionsPath, "utf-8");
      for (const line of actionsRaw.trim().split("\n")) {
        if (line.trim()) actions.push(JSON.parse(line));
      }
    } catch { /* no actions file */ }

    const frames: Frame[] = [];
    const framesDir = path.join(fullPath, "frames");
    try {
      const frameDirs = await fs.readdir(framesDir);
      for (const dir of frameDirs) {
        const framePath = path.join(framesDir, dir);
        const stat = await fs.stat(framePath);
        if (!stat.isDirectory()) continue;
        const step = parseInt(dir, 10);
        const ssFiles = await fs.readdir(framePath);
        const screenshot = ssFiles.find((f) => f.endsWith(".jpg") || f.endsWith(".jpeg"));
        frames.push({
          step,
          timestamp: stat.mtime.toISOString(),
          screenshotPath: path.join(framePath, screenshot ?? ""),
          domSnapshotPath: path.join(framePath, "dom.json"),
          url: "",
          pageTitle: "",
        });
      }
    } catch { /* no frames */ }

    return { manifest, frames: frames.sort((a, b) => a.step - b.step), thoughts, actions };
  } catch (err) {
    console.error(`Failed to load session ${sessionId}:`, err);
    return null;
  }
}

export async function deleteSession(sessionDir: string, sessionId: string): Promise<boolean> {
  try {
    await fs.rm(path.join(sessionDir, sessionId), { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

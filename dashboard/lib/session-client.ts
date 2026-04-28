import type { SessionManifest, SessionData } from "./types";

const BASE = "/api";

export async function fetchSessions(): Promise<SessionManifest[]> {
  const res = await fetch(`${BASE}/sessions`);
  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`);
  return res.json();
}

export async function fetchSession(id: string): Promise<SessionData> {
  const res = await fetch(`${BASE}/sessions?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch session: ${res.statusText}`);
  return res.json();
}

export async function deleteSession(id: string): Promise<boolean> {
  const res = await fetch(`${BASE}/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  return res.ok;
}

export function createReplayStream(
  sessionId: string,
  onAction: (data: unknown) => void,
  onThought: (data: unknown) => void,
  onError: (err: Event) => void,
): EventSource {
  const es = new EventSource(`/api/replay?sessionId=${encodeURIComponent(sessionId)}`);
  es.addEventListener("action", (e) => { try { onAction(JSON.parse(e.data)); } catch { /* skip */ } });
  es.addEventListener("thought", (e) => { try { onThought(JSON.parse(e.data)); } catch { /* skip */ } });
  es.onerror = onError;
  return es;
}

export async function sendIntervention(sessionId: string, command: string, message?: string): Promise<void> {
  await fetch("/api/intervene", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, command, message }) });
}

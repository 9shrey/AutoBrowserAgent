import type { Frame, Thought, ActionResult } from "../lib/types";

interface Props { frame?: Frame; step: number; thought?: Thought; action?: ActionResult; }

export default function BrowserViewport({ frame, step, thought, action }: Props) {
  if (!frame) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", color: "#484f58", fontSize: 14 }}>No frame data for step {step}</div>;
  }
  const hasScreenshot = frame.screenshotPath && !frame.screenshotPath.endsWith("/");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 20, width: "100%" }}>
      <div style={{ marginBottom: 12, fontSize: 12, color: "#8b949e", display: "flex", gap: 16 }}>
        <span>URL: <span style={{ color: "#58a6ff" }}>{frame.url || "--"}</span></span>
        <span>Title: {frame.pageTitle || "--"}</span>
        <span>Step {step}</span>
        {action && <span>Action: <strong style={{ color: "#f0f6fc" }}>{action.action.action}</strong></span>}
      </div>
      <div style={{ border: "1px solid #30363d", borderRadius: 8, overflow: "hidden", background: "#0d1117", maxWidth: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
        {hasScreenshot ? (
          <img src={`/api/screenshots?path=${encodeURIComponent(frame.screenshotPath)}`} alt={`Step ${step} screenshot`} style={{ maxWidth: "100%", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; const n = (e.target as HTMLImageElement).nextElementSibling; if (n) (n as HTMLElement).style.display = "flex"; }} />
        ) : null}
        <div style={{ display: hasScreenshot ? "none" : "flex", justifyContent: "center", alignItems: "center", width: 1024, height: 600, maxWidth: "100%", color: "#484f58", fontSize: 14, flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 32 }}>📸</span>
          <span>Screenshot not available</span>
          <span style={{ fontSize: 12 }}>Run with HEADLESS=false to capture screenshots</span>
        </div>
      </div>
      {frame.domSnapshotPath && (
        <details style={{ marginTop: 12, width: "100%", maxWidth: 1024 }}>
          <summary style={{ fontSize: 12, color: "#8b949e", cursor: "pointer", padding: "4px 0" }}>DOM Snapshot</summary>
          <pre style={{ fontSize: 11, background: "#161b22", border: "1px solid #21262d", borderRadius: 6, padding: 12, maxHeight: 300, overflow: "auto", color: "#8b949e", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>DOM snapshot data — view raw file:{"\n"}{frame.domSnapshotPath}</pre>
        </details>
      )}
    </div>
  );
}

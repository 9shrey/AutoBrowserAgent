import { useState } from "react";

interface Props { sessionId: string; }

export default function InterveneBar({ sessionId }: Props) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendCommand = async (command: string) => {
    setSending(true);
    try {
      await fetch("/api/intervene", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, command, message: command === "redirect" ? message : undefined }) });
      if (command === "redirect") setMessage("");
    } catch (err) { console.error("Intervention failed:", err); }
    finally { setSending(false); }
  };

  const btnStyle: React.CSSProperties = { border: "1px solid", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: 4 }}>Intervene</span>
      <button onClick={() => sendCommand("pause")} disabled={sending} style={{ ...btnStyle, background: "#3a2a1a", borderColor: "#5c3d1e", color: "#d2991d" }}>⏸ Pause</button>
      <button onClick={() => sendCommand("resume")} disabled={sending} style={{ ...btnStyle, background: "#1a3a2a", borderColor: "#1e5c3d", color: "#3fb950" }}>▶ Resume</button>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="New instruction..." style={{ background: "#161b22", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: 200 }}
        onKeyDown={(e) => { if (e.key === "Enter" && message.trim()) sendCommand("redirect"); }} />
      <button onClick={() => message.trim() && sendCommand("redirect")} disabled={sending || !message.trim()} style={{ ...btnStyle, background: "#1a2a3a", borderColor: "#1e3d5c", color: "#58a6ff", opacity: message.trim() ? 1 : 0.5 }}>↩ Redirect</button>
      <button onClick={() => sendCommand("takeover")} disabled={sending} style={{ ...btnStyle, background: "#2a1a3a", borderColor: "#3d1e5c", color: "#a371f7" }}>🖐 Takeover</button>
    </div>
  );
}

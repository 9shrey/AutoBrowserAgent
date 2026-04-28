import { useState } from "react";
import type { Thought, ActionResult } from "../lib/types";

interface Props { thought: Thought; action?: ActionResult; }

export default function ThoughtBubble({ thought, action }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const confColor = thought.confidence > 0.7 ? "#3fb950" : thought.confidence > 0.4 ? "#d2991d" : "#f85149";

  return (
    <div style={{ position: "fixed", bottom: 140, right: 20, maxWidth: 360, background: "#161b22", border: "1px solid #30363d", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 10, overflow: "hidden" }}>
      <div onClick={() => setCollapsed(!collapsed)} style={{ padding: "10px 14px", background: "#1c2333", borderBottom: collapsed ? "none" : "1px solid #21262d", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>💭</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f6fc" }}>Agent Thought — Step {thought.step}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 8, background: `${confColor}20`, color: confColor, fontWeight: 600 }}>{Math.round(thought.confidence * 100)}% confident</span>
          <span style={{ fontSize: 12, color: "#8b949e" }}>{collapsed ? "▲" : "▼"}</span>
        </div>
      </div>
      {!collapsed && (
        <div style={{ padding: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Thought</div>
            <div style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.6 }}>{thought.thought}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Reasoning</div>
            <div style={{ fontSize: 13, color: "#8b949e", lineHeight: 1.5 }}>{thought.reasoning}</div>
          </div>
          {action && (
            <div>
              <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Action</div>
              <div style={{ fontSize: 12, fontFamily: "monospace", background: "#0d1117", padding: "6px 10px", borderRadius: 6, color: "#58a6ff", wordBreak: "break-all" }}>{JSON.stringify(action.action)}</div>
              {action.result && <div style={{ fontSize: 12, marginTop: 4, color: action.success ? "#3fb950" : "#f85149" }}>{action.success ? "✓" : "✗"} {action.result.slice(0, 150)}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

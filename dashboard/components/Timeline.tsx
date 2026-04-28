import { useRef, useEffect, useState } from "react";
import type { Thought, ActionResult } from "../lib/types";

interface Props { totalSteps: number; currentStep: number; onSeek: (step: number) => void; thoughts: Thought[]; actions: ActionResult[]; }

export default function Timeline({ totalSteps, currentStep, onSeek, thoughts, actions }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const step = Math.max(1, Math.round(ratio * totalSteps));
    setHoveredStep(step);
    if (dragging) onSeek(step);
  };

  const handleMouseDown = (e: React.MouseEvent) => { setDragging(true); handleMouseMove(e); };

  useEffect(() => {
    const handleUp = () => setDragging(false);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => { window.removeEventListener("mouseup", handleUp); window.removeEventListener("mousemove", handleMouseMove); };
  }, [dragging]);

  const hoveredAction = hoveredStep ? actions.find((a) => a.step === hoveredStep) : null;
  const hoveredThought = hoveredStep ? thoughts.find((t) => t.step === hoveredStep) : null;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#8b949e" }}>Timeline</span>
        <span style={{ fontSize: 12, color: "#8b949e" }}>Step {currentStep} / {totalSteps}</span>
      </div>
      <div ref={barRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseLeave={() => !dragging && setHoveredStep(null)}
        style={{ height: 32, background: "#21262d", borderRadius: 4, position: "relative", cursor: "pointer", userSelect: "none" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(currentStep / totalSteps) * 100}%`, background: "rgba(88, 166, 255, 0.25)", borderRadius: 4, pointerEvents: "none" }} />
        {actions.map((a) => {
          const isError = !a.success;
          return (
            <div key={a.step} title={`Step ${a.step}: ${a.action.action} ${isError ? "❌" : "✓"}`}
              style={{ position: "absolute", left: `${((a.step - 1) / Math.max(totalSteps - 1, 1)) * 100}%`, top: "50%", transform: "translate(-50%, -50%)", width: 8, height: 8, borderRadius: "50%", background: isError ? "#f85149" : "#3fb950", border: "2px solid #161b22", zIndex: 2 }} />
          );
        })}
        <div style={{ position: "absolute", left: `${(currentStep / totalSteps) * 100}%`, top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: "#58a6ff", border: "2px solid #0d1117", boxShadow: "0 0 0 2px rgba(88, 166, 255, 0.4)", zIndex: 3, pointerEvents: "none" }} />
      </div>
      {hoveredStep && !dragging && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#8b949e", display: "flex", gap: 16 }}>
          <span>Step {hoveredStep}</span>
          {hoveredAction && <span>Action: <strong style={{ color: "#c9d1d9" }}>{hoveredAction.action.action}</strong>{!hoveredAction.success && <span style={{ color: "#f85149" }}> (failed)</span>}</span>}
          {hoveredThought && <span>Confidence: <strong style={{ color: "#c9d1d9" }}>{(hoveredThought.confidence * 100).toFixed(0)}%</strong></span>}
        </div>
      )}
    </div>
  );
}

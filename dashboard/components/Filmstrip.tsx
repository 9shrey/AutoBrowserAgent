import type { Frame, Thought } from "../../shared/types.js";

interface Props {
  frames: Frame[];
  currentStep: number;
  onSelectStep: (step: number) => void;
  thoughts: Thought[];
}

export default function Filmstrip({ frames, currentStep, onSelectStep, thoughts }: Props) {
  return (
    <div>
      <div
        style={{
          padding: "12px 16px",
          fontSize: 12,
          fontWeight: 600,
          color: "#8b949e",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderBottom: "1px solid #21262d",
        }}
      >
        Filmstrip
      </div>
      {frames.map((frame) => {
        const isActive = frame.step === currentStep;
        const thought = thoughts.find((t) => t.step === frame.step);
        const confColor =
          (thought?.confidence ?? 0) > 0.7 ? "#3fb950" :
          (thought?.confidence ?? 0) > 0.4 ? "#d2991d" : "#f85149";

        return (
          <div
            key={frame.step}
            onClick={() => onSelectStep(frame.step)}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              background: isActive ? "#1f2937" : "transparent",
              borderLeft: isActive ? "3px solid #58a6ff" : "3px solid transparent",
              borderBottom: "1px solid #21262d",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLDivElement).style.background = "#1c2128";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: "#c9d1d9" }}>
                Step {frame.step}
              </span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: confColor,
                  display: "inline-block",
                }}
                title={`Confidence: ${thought?.confidence?.toFixed(2) ?? "?"}`}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#8b949e",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {thought?.thought?.slice(0, 50) ?? "No thought recorded"}
            </div>
          </div>
        );
      })}
      {frames.length === 0 && (
        <div style={{ padding: 16, fontSize: 13, color: "#484f58" }}>
          No frames yet
        </div>
      )}
    </div>
  );
}

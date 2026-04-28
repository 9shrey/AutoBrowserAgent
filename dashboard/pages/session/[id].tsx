import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { SessionData } from "../../../recorder/session-store.js";
import Filmstrip from "../../components/Filmstrip.js";
import Timeline from "../../components/Timeline.js";
import ThoughtBubble from "../../components/ThoughtBubble.js";
import BrowserViewport from "../../components/BrowserViewport.js";
import ArtifactPanel from "../../components/ArtifactPanel.js";
import InterveneBar from "../../components/InterveneBar.js";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  } as React.CSSProperties,
  topBar: {
    background: "#161b22",
    borderBottom: "1px solid #21262d",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  } as React.CSSProperties,
  topTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f0f6fc",
  } as React.CSSProperties,
  topMeta: {
    fontSize: 12,
    color: "#8b949e",
  } as React.CSSProperties,
  backBtn: {
    background: "none",
    border: "1px solid #30363d",
    color: "#c9d1d9",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 13,
  } as React.CSSProperties,
  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  } as React.CSSProperties,
  sidebar: {
    width: 220,
    background: "#161b22",
    borderRight: "1px solid #21262d",
    overflowY: "auto",
    flexShrink: 0,
  } as React.CSSProperties,
  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as React.CSSProperties,
  viewport: {
    flex: 1,
    overflow: "auto",
    position: "relative",
    display: "flex",
    justifyContent: "center",
    background: "#0d1117",
  } as React.CSSProperties,
  bottomBar: {
    background: "#161b22",
    borderTop: "1px solid #21262d",
    padding: "12px 20px",
    flexShrink: 0,
  } as React.CSSProperties,
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    color: "#8b949e",
    fontSize: 16,
  } as React.CSSProperties,
};

export default function SessionReplay() {
  const router = useRouter();
  const { id } = router.query;
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showArtifacts, setShowArtifacts] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/sessions?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load session:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={styles.loading}>Loading session...</div>;
  if (!session) return <div style={styles.loading}>Session not found</div>;

  const currentThought = session.thoughts.find((t) => t.step === currentStep);
  const currentAction = session.actions.find((a) => a.step === currentStep);
  const currentFrame = session.frames.find((f) => f.step === currentStep);
  const totalSteps = session.manifest.totalSteps;

  return (
    <div style={styles.container}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div>
          <div style={styles.topTitle}>{session.manifest.task.slice(0, 100)}</div>
          <div style={styles.topMeta}>
            {session.manifest.totalSteps} steps · {session.manifest.status} ·{" "}
            {session.manifest.llmModel}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            style={styles.backBtn}
            onClick={() => setShowArtifacts(!showArtifacts)}
          >
            {showArtifacts ? "Replay" : "Artifacts"}
          </button>
          <button style={styles.backBtn} onClick={() => router.push("/")}>
            Back
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={styles.main}>
        {/* Sidebar filmstrip */}
        <div style={styles.sidebar}>
          <Filmstrip
            frames={session.frames}
            currentStep={currentStep}
            onSelectStep={setCurrentStep}
            thoughts={session.thoughts}
          />
        </div>

        {/* Center */}
        <div style={styles.center}>
          <div style={styles.viewport}>
            {showArtifacts ? (
              <ArtifactPanel manifest={session.manifest} />
            ) : (
              <BrowserViewport
                frame={currentFrame}
                step={currentStep}
                thought={currentThought}
                action={currentAction}
              />
            )}
          </div>

          {/* Bottom: timeline + intervene */}
          <div style={styles.bottomBar}>
            <Timeline
              totalSteps={totalSteps}
              currentStep={currentStep}
              onSeek={setCurrentStep}
              thoughts={session.thoughts}
              actions={session.actions}
            />
            <InterveneBar sessionId={session.manifest.id} />
          </div>
        </div>
      </div>

      {/* Thought bubble overlay */}
      {currentThought && !showArtifacts && (
        <ThoughtBubble thought={currentThought} action={currentAction} />
      )}
    </div>
  );
}

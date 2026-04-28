import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { SessionData } from "../../lib/types";
import Filmstrip from "../../components/Filmstrip";
import Timeline from "../../components/Timeline";
import ThoughtBubble from "../../components/ThoughtBubble";
import BrowserViewport from "../../components/BrowserViewport";
import ArtifactPanel from "../../components/ArtifactPanel";
import InterveneBar from "../../components/InterveneBar";

type Styles = Record<string, React.CSSProperties>;
const styles: Styles = {
  container: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" },
  topBar: { background: "#161b22", borderBottom: "1px solid #21262d", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 },
  topTitle: { fontSize: 15, fontWeight: 600, color: "#f0f6fc" },
  topMeta: { fontSize: 12, color: "#8b949e" },
  backBtn: { background: "none", border: "1px solid #30363d", color: "#c9d1d9", borderRadius: 6, padding: "6px 12px", fontSize: 13 },
  main: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: 220, background: "#161b22", borderRight: "1px solid #21262d", overflowY: "auto", flexShrink: 0 },
  center: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  viewport: { flex: 1, overflow: "auto", position: "relative", display: "flex", justifyContent: "center", background: "#0d1117" },
  bottomBar: { background: "#161b22", borderTop: "1px solid #21262d", padding: "12px 20px", flexShrink: 0 },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#8b949e", fontSize: 16 },
};


export default function SessionReplay() {
  const router = useRouter();
  const { id } = router.query;
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id || typeof id !== "string") return;
    fetch(`/api/sessions?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        if (!data.manifest) { setError("Session data is incomplete"); return; }
        setSession(data);
      })
      .catch((err) => { setError(err.message); })
      .finally(() => { setLoading(false); });
  }, [router.isReady, id]);

  if (loading) return <div style={styles.loading}>Loading session...</div>;
  if (error) return <div style={styles.loading}>Error: {error}</div>;
  if (!session || !session.manifest) return <div style={styles.loading}>Session not found</div>;

  const thoughts = session.thoughts || [];
  const actions = session.actions || [];
  const frames = session.frames || [];
  const currentThought = thoughts.find((t) => t.step === currentStep);
  const currentAction = actions.find((a) => a.step === currentStep);
  const currentFrame = frames.find((f) => f.step === currentStep);
  const totalSteps = session.manifest.totalSteps;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.topTitle}>{(session.manifest?.task || "Unknown task").slice(0, 100)}</div>
          <div style={styles.topMeta}>{session.manifest.totalSteps} steps · {session.manifest.status} · {session.manifest.llmModel}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={styles.backBtn} onClick={() => setShowArtifacts(!showArtifacts)}>{showArtifacts ? "Replay" : "Artifacts"}</button>
          <button style={styles.backBtn} onClick={() => router.push("/")}>Back</button>
        </div>
      </div>
      <div style={styles.main}>
        <div style={styles.sidebar}>
          <Filmstrip frames={frames} currentStep={currentStep} onSelectStep={setCurrentStep} thoughts={thoughts} />
        </div>
        <div style={styles.center}>
          <div style={styles.viewport}>
            {showArtifacts ? (
              <ArtifactPanel manifest={session.manifest} />
            ) : (
              <BrowserViewport frame={currentFrame} step={currentStep} thought={currentThought} action={currentAction} />
            )}
          </div>
          <div style={styles.bottomBar}>
            <Timeline totalSteps={totalSteps} currentStep={currentStep} onSeek={setCurrentStep} thoughts={thoughts} actions={actions} />
            <InterveneBar sessionId={session.manifest.id} />
          </div>
        </div>
      </div>
      {currentThought && !showArtifacts && <ThoughtBubble thought={currentThought} action={currentAction} />}
    </div>
  );
}

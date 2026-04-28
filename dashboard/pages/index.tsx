import { useEffect, useState } from "react";
import type { SessionManifest } from "../../shared/types.js";

const styles = {
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "40px 24px",
  } as React.CSSProperties,
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  } as React.CSSProperties,
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#f0f6fc",
  } as React.CSSProperties,
  subtitle: {
    fontSize: 14,
    color: "#8b949e",
    marginTop: 4,
  } as React.CSSProperties,
  card: {
    background: "#161b22",
    border: "1px solid #21262d",
    borderRadius: 8,
    padding: "20px 24px",
    marginBottom: 12,
    transition: "border-color 0.2s",
    cursor: "pointer",
  } as React.CSSProperties,
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#f0f6fc",
    marginBottom: 8,
  } as React.CSSProperties,
  cardMeta: {
    display: "flex",
    gap: 24,
    fontSize: 13,
    color: "#8b949e",
    flexWrap: "wrap",
  } as React.CSSProperties,
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  } as React.CSSProperties,
  statusColors: {
    completed: { bg: "#1a3a2a", color: "#3fb950" },
    running: { bg: "#1a2a3a", color: "#58a6ff" },
    paused: { bg: "#3a2a1a", color: "#d2991d" },
    failed: { bg: "#3a1a1a", color: "#f85149" },
    intervened: { bg: "#2a1a3a", color: "#a371f7" },
  } as Record<string, { bg: string; color: string }>,
  empty: {
    textAlign: "center",
    padding: 80,
    color: "#8b949e",
  } as React.CSSProperties,
  refreshBtn: {
    background: "#21262d",
    color: "#c9d1d9",
    border: "1px solid #30363d",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
  } as React.CSSProperties,
};

export default function Home() {
  const [sessions, setSessions] = useState<SessionManifest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatDuration = (ms?: number) => {
    if (!ms) return "--";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "--";
    return new Date(iso).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>AutoBrowserAgent</h1>
          <p style={styles.subtitle}>Session Replay Dashboard</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchSessions}>
          Refresh
        </button>
      </div>

      {loading && <div style={styles.empty}>Loading sessions...</div>}

      {!loading && sessions.length === 0 && (
        <div style={styles.empty}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>No sessions yet</p>
          <p>Run the agent with: npx tsx agent/run.ts &quot;your task here&quot;</p>
        </div>
      )}

      {sessions.map((s) => {
        const colors = styles.statusColors[s.status] ?? styles.statusColors.completed;
        return (
          <a key={s.id} href={`/session/${s.id}`} style={{ textDecoration: "none" }}>
            <div
              style={styles.card}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#58a6ff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#21262d";
              }}
            >
              <div style={styles.cardTitle}>{s.task.slice(0, 120)}</div>
              <div style={styles.cardMeta}>
                <span>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: colors.bg,
                      color: colors.color,
                    }}
                  >
                    {s.status}
                  </span>
                </span>
                <span>{s.totalSteps} steps</span>
                <span>{formatDuration(s.durationMs)}</span>
                <span>Model: {s.llmProvider}/{s.llmModel}</span>
                <span>{formatDate(s.startedAt)}</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

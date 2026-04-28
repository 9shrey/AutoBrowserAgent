import { useState, useEffect } from "react";
import type { SessionManifest } from "../../shared/types.js";

interface Props {
  manifest: SessionManifest;
}

export default function ArtifactPanel({ manifest }: Props) {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<object | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load the artifact files via API
    const fetchArtifacts = async () => {
      try {
        const res = await fetch(`/api/sessions?id=${manifest.id}`);
        if (!res.ok) return;
        const session = await res.json();

        // For now, show artifact paths
        setJsonData(session);
      } catch (err) {
        console.error("Failed to load artifacts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifacts();
  }, [manifest.id]);

  return (
    <div style={{ padding: 24, width: "100%", maxWidth: 960 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f0f6fc", marginBottom: 16 }}>
        Artifacts
      </h2>

      {loading && <div style={{ color: "#8b949e", fontSize: 14 }}>Loading artifacts...</div>}

      {/* Session info */}
      {manifest.artifacts && manifest.artifacts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#c9d1d9", marginBottom: 8 }}>
            Generated Files
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {manifest.artifacts.map((path, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  padding: "8px 12px",
                  background: "#161b22",
                  border: "1px solid #21262d",
                  borderRadius: 6,
                  color: "#58a6ff",
                }}
              >
                {path}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(path);
                  }}
                  style={{
                    marginLeft: 12,
                    background: "none",
                    border: "none",
                    color: "#8b949e",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  title="Copy path"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session metadata */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#c9d1d9", marginBottom: 8 }}>
          Session Metadata
        </h3>
        <div
          style={{
            background: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 8,
            padding: 16,
            fontSize: 13,
            color: "#c9d1d9",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Session ID", manifest.id],
                ["Status", manifest.status],
                ["Started", manifest.startedAt],
                ["Finished", manifest.finishedAt ?? "--"],
                ["Duration", manifest.durationMs ? `${(manifest.durationMs / 1000).toFixed(1)}s` : "--"],
                ["Steps", String(manifest.totalSteps)],
                ["LLM Provider", manifest.llmProvider],
                ["LLM Model", manifest.llmModel],
                ["Tags", manifest.tags?.join(", ") ?? "--"],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #21262d" }}>
                  <td
                    style={{
                      padding: "6px 12px",
                      color: "#8b949e",
                      width: 160,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: "6px 12px" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

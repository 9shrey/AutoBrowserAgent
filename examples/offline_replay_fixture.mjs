import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sessionDir = path.join(root, "examples", "saved_sessions", "shopping-comparison");
const resultsDir = path.join(root, "results", "shopping-comparison");

fs.mkdirSync(path.join(sessionDir, "frames"), { recursive: true });
fs.mkdirSync(path.join(sessionDir, "artifacts"), { recursive: true });
fs.mkdirSync(resultsDir, { recursive: true });

const manifest = {
  id: "shopping-comparison",
  task: "Compare three espresso grinders under $500 and export a table",
  status: "completed",
  startedAt: "2026-05-04T00:00:00.000Z",
  finishedAt: "2026-05-04T00:01:38.000Z",
  durationMs: 98000,
  totalSteps: 6,
  llmProvider: "offline-fixture",
  llmModel: "scripted",
  artifacts: ["artifacts/comparison.csv", "artifacts/comparison.json"],
  tags: ["shopping", "comparison", "offline-fixture"],
};

const actions = [
  { step: 1, action: "navigate", target: "https://example.local/search?q=espresso+grinder", result: "success" },
  { step: 2, action: "extract", target: "search results", result: "3 product pages queued" },
  { step: 3, action: "navigate", target: "review page A", result: "success" },
  { step: 4, action: "extract", target: "product specs", result: "Baratza Encore ESP captured" },
  { step: 5, action: "extract", target: "comparison table", result: "3 rows captured" },
  { step: 6, action: "done", target: "task", result: "artifacts exported" },
];

const thoughts = [
  { step: 1, confidence: 0.82, thought: "Start broad and collect candidates before filtering by price." },
  { step: 3, confidence: 0.77, thought: "Prioritize pages with clear specs and recent reviews." },
  { step: 6, confidence: 0.91, thought: "All requested columns are present; export CSV and JSON." },
];

const comparison = [
  { product: "Baratza Encore ESP", price: "$199", burr: "40mm conical", score: 8.8, reason: "Best value" },
  { product: "Fellow Opus", price: "$195", burr: "40mm conical", score: 8.4, reason: "Quiet, compact" },
  { product: "DF54", price: "$229", burr: "54mm flat", score: 8.7, reason: "Strong espresso clarity" },
];

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function writeJsonl(file, rows) {
  fs.writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
}

function writeCsv(file, rows) {
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => String(row[header]).replaceAll('"', '""'))
        .map((value) => `"${value}"`)
        .join(","),
    ),
  ];
  fs.writeFileSync(file, lines.join("\n") + "\n");
}

writeJson(path.join(sessionDir, "manifest.json"), manifest);
writeJsonl(path.join(sessionDir, "actions.jsonl"), actions);
writeJsonl(path.join(sessionDir, "thoughts.jsonl"), thoughts);
writeCsv(path.join(sessionDir, "artifacts", "comparison.csv"), comparison);
writeJson(path.join(sessionDir, "artifacts", "comparison.json"), comparison);
writeCsv(path.join(resultsDir, "comparison.csv"), comparison);
writeJson(path.join(resultsDir, "comparison.json"), comparison);
writeJson(path.join(resultsDir, "run_manifest.json"), manifest);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="AutoBrowserAgent replay dashboard screenshot">
  <rect width="960" height="540" fill="#0b1020"/>
  <rect x="24" y="24" width="220" height="492" rx="8" fill="#111827" stroke="#263244"/>
  <rect x="268" y="24" width="668" height="340" rx="8" fill="#f8fafc"/>
  <rect x="268" y="388" width="668" height="128" rx="8" fill="#111827" stroke="#263244"/>
  <text x="44" y="62" fill="#e5e7eb" font-family="Arial" font-size="20">Filmstrip</text>
  <text x="292" y="62" fill="#0f172a" font-family="Arial" font-size="22">Replay Viewport</text>
  <text x="292" y="426" fill="#e5e7eb" font-family="Arial" font-size="18">Thought: all requested columns are present; export CSV and JSON.</text>
  <g fill="#38bdf8">
    <rect x="44" y="92" width="176" height="54" rx="6"/>
    <rect x="44" y="162" width="176" height="54" rx="6" opacity="0.7"/>
    <rect x="44" y="232" width="176" height="54" rx="6" opacity="0.45"/>
  </g>
  <g fill="#0f172a" font-family="Arial" font-size="16">
    <text x="308" y="128">Product</text><text x="540" y="128">Price</text><text x="670" y="128">Score</text>
    <text x="308" y="172">Baratza Encore ESP</text><text x="540" y="172">$199</text><text x="670" y="172">8.8</text>
    <text x="308" y="216">Fellow Opus</text><text x="540" y="216">$195</text><text x="670" y="216">8.4</text>
    <text x="308" y="260">DF54</text><text x="540" y="260">$229</text><text x="670" y="260">8.7</text>
  </g>
</svg>
`;
fs.writeFileSync(path.join(resultsDir, "replay_dashboard.svg"), svg);

const extraScenarios = [
  {
    id: "job-search",
    task: "Find three remote junior ML engineer roles and export application notes",
    rows: [
      { company: "Northstar AI", role: "Junior ML Engineer", location: "Remote US", fit: "Python, sklearn, MLflow" },
      { company: "MetricOps", role: "MLOps Associate", location: "Remote", fit: "CI/CD, monitoring, Docker" },
      { company: "BrowserStack Labs", role: "AI Agent Engineer", location: "Hybrid", fit: "Playwright, TypeScript" },
    ],
  },
  {
    id: "data-extraction",
    task: "Extract pricing tiers from a SaaS pricing page",
    rows: [
      { plan: "Starter", price: "$19", seats: "3", notes: "basic automation" },
      { plan: "Growth", price: "$79", seats: "15", notes: "team replay and exports" },
      { plan: "Scale", price: "custom", seats: "unlimited", notes: "SAML and audit logs" },
    ],
  },
];

for (const scenario of extraScenarios) {
  const scenarioSession = path.join(root, "examples", "saved_sessions", scenario.id);
  const scenarioResults = path.join(root, "results", scenario.id);
  fs.mkdirSync(path.join(scenarioSession, "artifacts"), { recursive: true });
  fs.mkdirSync(scenarioResults, { recursive: true });
  const scenarioManifest = {
    ...manifest,
    id: scenario.id,
    task: scenario.task,
    artifacts: ["artifacts/export.csv", "artifacts/export.json"],
    tags: [scenario.id, "offline-fixture"],
  };
  writeJson(path.join(scenarioSession, "manifest.json"), scenarioManifest);
  writeJsonl(path.join(scenarioSession, "actions.jsonl"), [
    { step: 1, action: "navigate", target: "seed page", result: "success" },
    { step: 2, action: "extract", target: scenario.task, result: `${scenario.rows.length} rows captured` },
    { step: 3, action: "done", target: "export", result: "csv and json written" },
  ]);
  writeJsonl(path.join(scenarioSession, "thoughts.jsonl"), [
    { step: 2, confidence: 0.86, thought: "The requested fields are visible and normalized." },
  ]);
  writeCsv(path.join(scenarioSession, "artifacts", "export.csv"), scenario.rows);
  writeJson(path.join(scenarioSession, "artifacts", "export.json"), scenario.rows);
  writeCsv(path.join(scenarioResults, "export.csv"), scenario.rows);
  writeJson(path.join(scenarioResults, "export.json"), scenario.rows);
  writeJson(path.join(scenarioResults, "run_manifest.json"), scenarioManifest);
}

console.log("Wrote offline replay fixtures for shopping-comparison, job-search, and data-extraction");

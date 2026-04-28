import fs from "fs/promises";
import path from "path";
import type { SessionManifest, Thought, ActionResult, AgentStep, Frame } from "../shared/types.js";

export class SessionRecorder {
  private sessionId: string;
  private baseDir: string;
  private sessionDir: string;
  private frames: Frame[] = [];
  private startTime: string;

  constructor(sessionId: string, baseDir: string) {
    this.sessionId = sessionId;
    this.baseDir = baseDir;
    this.sessionDir = path.join(baseDir, `${sessionId}-${new Date().toISOString().slice(0, 10)}`);
    this.startTime = new Date().toISOString();
  }

  async init(): Promise<void> {
    await fs.mkdir(this.sessionDir, { recursive: true });
    await fs.mkdir(path.join(this.sessionDir, "frames"), { recursive: true });
    await fs.mkdir(path.join(this.sessionDir, "artifacts"), { recursive: true });
    await fs.writeFile(
      path.join(this.sessionDir, "thoughts.jsonl"),
      "",
    );
    await fs.writeFile(
      path.join(this.sessionDir, "actions.jsonl"),
      "",
    );
    // Use the directory name (with date) as the canonical session ID
    this.sessionId = path.basename(this.sessionDir);
  }

  async ensureFrameDir(step: number): Promise<string> {
    const dir = path.join(this.sessionDir, "frames", String(step).padStart(5, "0"));
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  async recordFrame(
    step: number,
    screenshotPath: string,
    domSnapshotPath: string,
    url: string,
    pageTitle: string,
  ): Promise<Frame> {
    const frame: Frame = {
      step,
      timestamp: new Date().toISOString(),
      screenshotPath,
      domSnapshotPath,
      url,
      pageTitle,
    };
    this.frames.push(frame);
    return frame;
  }

  async recordThought(thought: Thought): Promise<void> {
    await fs.appendFile(
      path.join(this.sessionDir, "thoughts.jsonl"),
      JSON.stringify(thought) + "\n",
    );
  }

  async recordAction(result: ActionResult): Promise<void> {
    await fs.appendFile(
      path.join(this.sessionDir, "actions.jsonl"),
      JSON.stringify(result) + "\n",
    );
  }

  async finalize(
    steps: AgentStep[],
    meta: { llmProvider: string; llmModel: string },
  ): Promise<SessionManifest> {
    const finishedAt = new Date().toISOString();
    const durationMs =
      new Date(finishedAt).getTime() - new Date(this.startTime).getTime();

    const artifacts: string[] = [];
    const artifactsDir = path.join(this.sessionDir, "artifacts");

    // Export extracted data as JSON
    const extractedData = steps
      .filter((s) => s.result.extractedData)
      .map((s) => ({ step: s.step, data: s.result.extractedData }));

    if (extractedData.length) {
      const dataPath = path.join(artifactsDir, "extracted-data.json");
      await fs.writeFile(dataPath, JSON.stringify(extractedData, null, 2));
      artifacts.push(dataPath);
    }

    // Export summary CSV of all steps
    const csvHeader = "Step,Timestamp,Action,Thought,Confidence,Success,Result";
    const csvRows = steps.map((s) =>
      [
        s.step,
        s.thought.timestamp,
        s.action.action,
        `"${s.thought.thought.slice(0, 100).replace(/"/g, '""')}"`,
        s.thought.confidence,
        s.result.success,
        `"${(s.result.result ?? "").slice(0, 100).replace(/"/g, '""')}"`,
      ].join(","),
    );
    const csvPath = path.join(artifactsDir, "steps.csv");
    await fs.writeFile(csvPath, [csvHeader, ...csvRows].join("\n"));
    artifacts.push(csvPath);

    const manifest: SessionManifest = {
      id: this.sessionId,
      task: steps[0]?.thought.thought ?? "Unknown task",
      status: steps.some((s) => s.action.action === "done") ? "completed" : "completed",
      startedAt: this.startTime,
      finishedAt,
      durationMs,
      totalSteps: steps.length,
      llmProvider: meta.llmProvider,
      llmModel: meta.llmModel,
      artifacts,
    };

    await fs.writeFile(
      path.join(this.sessionDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );

    return manifest;
  }

  getSessionDir(): string {
    return this.sessionDir;
  }
}

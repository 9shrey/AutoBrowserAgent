import type { Page } from "playwright";
import type { AgentConfig, AgentStep, AgentTask, SessionManifest } from "../shared/types.js";
import { DEFAULTS } from "../shared/constants.js";
import { planNextAction } from "./planner.js";
import { executeAction } from "./executor.js";
import { evaluateAndCorrect } from "./self-correction.js";
import { captureScreenshot, captureDOMSnapshot, getPageContext } from "./vision.js";
import { validateAction } from "./tools.js";
import { SessionRecorder } from "../recorder/recorder.js";

export class AgentOrchestrator {
  private config: AgentConfig;
  private task: AgentTask;
  private recorder: SessionRecorder;
  private page: Page;
  private step = 0;
  private previousActions: string[] = [];
  private steps: AgentStep[] = [];
  private paused = false;
  private interveneMessage: string | null = null;

  constructor(config: AgentConfig, task: AgentTask, page: Page) {
    this.config = { ...config };
    this.task = task;
    this.page = page;
    this.recorder = new SessionRecorder(task.id, config.sessionDir);
  }

  async run(): Promise<SessionManifest> {
    await this.recorder.init();
    console.log(`\n[Agent] Starting task: ${this.task.instruction}`);
    console.log(`[Agent] Session: ${this.task.id}`);
    console.log(`[Agent] Model: ${this.config.llmProvider}/${this.config.llmModel}\n`);

    const maxSteps = this.task.maxSteps ?? this.config.maxSteps;

    while (this.step < maxSteps) {
      if (this.paused) {
        await this.waitForResume();
      }

      this.step++;
      const stepNumber = this.step;

      // 1. PERCEIVE — capture screenshot + DOM
      const frameDir = await this.recorder.ensureFrameDir(stepNumber);
      const screenshotPath = `${frameDir}/screenshot.${DEFAULTS.SCREENSHOT_FORMAT}`;
      const domPath = `${frameDir}/dom.json`;

      console.log(`[Step ${stepNumber}/${maxSteps}] Capturing screenshot...`);

      const pageContext = await getPageContext(this.page);
      await captureDOMSnapshot(this.page, domPath);
      await captureScreenshot(this.page, screenshotPath);

      const frame = await this.recorder.recordFrame(
        stepNumber,
        screenshotPath,
        domPath,
        pageContext.url,
        pageContext.title,
      );

      // 2. PLAN — LLM decides next action
      console.log(`[Step ${stepNumber}] Planning next action...`);

      const effectiveInstruction = this.interveneMessage ?? this.task.instruction;
      if (this.interveneMessage) {
        this.interveneMessage = null;
      }

      const thought = await planNextAction(
        this.config,
        effectiveInstruction,
        screenshotPath,
        { url: pageContext.url, title: pageContext.title },
        stepNumber,
        maxSteps,
        this.previousActions,
      );
      await this.recorder.recordThought(thought);
      console.log(
        `   Thought: ${thought.thought.slice(0, 120)}... [${thought.confidence.toFixed(2)}]`,
      );

      // 3. ACT — execute with retry loop
      const validation = validateAction(thought.nextAction as never);
      if (!validation.valid) {
        console.log(`   Invalid action: ${validation.error}`);
        this.previousActions.push(
          `[${stepNumber}] SKIPPED (invalid): ${JSON.stringify(thought.nextAction)} — ${validation.error}`,
        );
        continue;
      }

      const action = thought.nextAction as never;

      let actionResult = await executeAction(this.page, action, stepNumber);
      let retries = 0;

      while (!actionResult.success && retries < this.config.maxRetries) {
        const correction = await evaluateAndCorrect(
          this.config,
          thought,
          action,
          actionResult,
          retries,
        );

        if (!correction.shouldRetry) break;

        console.log(
          `   Retry ${retries + 1}/${this.config.maxRetries}: ${correction.reason}`,
        );

        if (correction.newApproach) {
          actionResult = await executeAction(this.page, correction.newApproach, stepNumber);
        } else {
          await this.page.waitForTimeout(1000);
          actionResult = await executeAction(this.page, action, stepNumber);
        }
        retries++;
      }

      await this.recorder.recordAction(actionResult);

      // 4. EVALUATE — log result
      const status = actionResult.success ? "OK" : "FAIL";
      console.log(
        `   Result: ${status} | ${(actionResult.result ?? actionResult.error ?? "").slice(0, 100)}`,
      );

      const step: AgentStep = {
        step: stepNumber,
        thought,
        action,
        result: actionResult,
        retries,
      };
      this.steps.push(step);

      this.previousActions.push(
        `[${stepNumber}] ${action.action}: ${actionResult.result ?? actionResult.error}`,
      );

      // Check if done
      if (action.action === "done") {
        console.log(`\n[Agent] Task complete after ${stepNumber} steps.`);
        break;
      }

      // Small delay between steps
      await this.page.waitForTimeout(500);
    }

    // Finalize session
    const manifest = await this.recorder.finalize(this.steps, {
      llmProvider: this.config.llmProvider,
      llmModel: this.config.llmModel,
    });

    console.log(`[Agent] Session saved: ${manifest.id}`);
    console.log(`[Agent] Artifacts: ${manifest.artifacts?.join(", ") ?? "none"}`);

    return manifest;
  }

  // ── Human intervention ──────────────────────────────────

  pause(): void {
    this.paused = true;
    console.log("[Agent] ⏸ Paused — waiting for human input");
  }

  redirect(message: string): void {
    this.interveneMessage = message;
    console.log(`[Agent] ↩ Redirect: ${message}`);
  }

  resume(): void {
    this.paused = false;
    console.log("[Agent] ▶ Resumed");
  }

  private async waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!this.paused) {
          clearInterval(interval);
          resolve();
        }
      }, 500);
    });
  }

  getState() {
    return { steps: this.steps, paused: this.paused, step: this.step };
  }
}

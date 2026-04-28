import { chromium } from "playwright";
import { v4 as uuid } from "uuid";
import { AgentOrchestrator } from "./orchestrator.js";
import type { AgentConfig, AgentTask } from "../shared/types.js";
import { BROWSER_DEFAULTS, DEFAULTS } from "../shared/constants.js";

async function main() {
  const instruction = process.argv[2];
  if (!instruction) {
    console.error("Usage: npx tsx agent/run.ts <instruction>");
    console.error('Example: npx tsx agent/run.ts "find me the best laptop under $1500"');
    process.exit(1);
  }

  const config: AgentConfig = {
    llmProvider: (process.env.LLM_PROVIDER as "openai" | "anthropic") ?? "openai",
    llmModel: process.env.LLM_MODEL ?? "gpt-4o",
    headless: process.env.HEADLESS === "true",
    maxRetries: DEFAULTS.MAX_RETRIES,
    maxSteps: DEFAULTS.MAX_STEPS,
    sessionDir: process.env.SESSION_DIR ?? DEFAULTS.SESSION_DIR,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  };

  const task: AgentTask = {
    id: `task-${uuid().slice(0, 8)}`,
    instruction,
    maxSteps: config.maxSteps,
    maxRetries: config.maxRetries,
    createdAt: new Date().toISOString(),
  };

  console.log("╔══════════════════════════════════════════╗");
  console.log("║     AutoBrowserAgent v1.0.0               ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\nProvider: ${config.llmProvider}`);
  console.log(`Model:    ${config.llmModel}`);
  console.log(`Headless: ${config.headless}`);
  console.log(`Task:     ${instruction}`);

  const browser = await chromium.launch({
    headless: config.headless,
  });

  const context = await browser.newContext({
    viewport: {
      width: BROWSER_DEFAULTS.VIEWPORT_WIDTH,
      height: BROWSER_DEFAULTS.VIEWPORT_HEIGHT,
    },
    userAgent: BROWSER_DEFAULTS.USER_AGENT,
  });

  const page = await context.newPage();

  try {
    const orchestrator = new AgentOrchestrator(config, task, page);
    const manifest = await orchestrator.run();

    console.log("\n═══════════════════════════════════════════");
    console.log(`Session ID:  ${manifest.id}`);
    console.log(`Status:      ${manifest.status}`);
    console.log(`Steps:       ${manifest.totalSteps}`);
    console.log(`Duration:    ${(manifest.durationMs ?? 0) / 1000}s`);
    console.log(`Artifacts:   ${manifest.artifacts?.join(", ") ?? "none"}`);
    console.log("═══════════════════════════════════════════\n");

    if (manifest.artifacts?.length) {
      console.log("Run the dashboard to replay:");
      console.log(`  cd dashboard && npm run dev`);
    }
  } catch (error) {
    console.error("\n[FATAL]", error);
  } finally {
    await browser.close();
  }
}

main();

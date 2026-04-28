import { z } from "zod";

// ─── Actions ───────────────────────────────────────────────

export const ActionType = z.enum([
  "navigate",
  "click",
  "type",
  "scroll",
  "extract",
  "wait",
  "screenshot",
  "done",
]);
export type ActionType = z.infer<typeof ActionType>;

export const BrowserAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("navigate"), url: z.string() }),
  z.object({
    action: z.literal("click"),
    selector: z.string().optional(),
    text: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }),
  z.object({
    action: z.literal("type"),
    selector: z.string(),
    text: z.string(),
    submit: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("scroll"),
    direction: z.enum(["up", "down"]).optional(),
    amount: z.number().optional(),
    selector: z.string().optional(),
  }),
  z.object({
    action: z.literal("extract"),
    schema: z.string().optional(),
    selector: z.string().optional(),
  }),
  z.object({ action: z.literal("wait"), ms: z.number().optional(), selector: z.string().optional() }),
  z.object({ action: z.literal("screenshot"), fullPage: z.boolean().optional() }),
  z.object({ action: z.literal("done"), summary: z.string().optional() }),
]);
export type BrowserAction = z.infer<typeof BrowserAction>;

// ─── Agent Loop ────────────────────────────────────────────

export const Thought = z.object({
  step: z.number(),
  timestamp: z.string(),
  thought: z.string(),
  confidence: z.number().min(0).max(1),
  nextAction: ActionType,
  reasoning: z.string(),
});
export type Thought = z.infer<typeof Thought>;

export const ActionResult = z.object({
  success: z.boolean(),
  step: z.number(),
  action: BrowserAction,
  result: z.string().optional(),
  error: z.string().optional(),
  urlAfter: z.string().optional(),
  extractedData: z.unknown().optional(),
  screenshotPath: z.string().optional(),
});
export type ActionResult = z.infer<typeof ActionResult>;

export const AgentStep = z.object({
  step: z.number(),
  thought: Thought,
  action: BrowserAction,
  result: ActionResult,
  retries: z.number().default(0),
});
export type AgentStep = z.infer<typeof AgentStep>;

// ─── Session ───────────────────────────────────────────────

export const SessionStatus = z.enum(["running", "paused", "completed", "failed", "intervened"]);
export type SessionStatus = z.infer<typeof SessionStatus>;

export const SessionManifest = z.object({
  id: z.string(),
  task: z.string(),
  status: SessionStatus,
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  durationMs: z.number().optional(),
  totalSteps: z.number(),
  llmProvider: z.string(),
  llmModel: z.string(),
  artifacts: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});
export type SessionManifest = z.infer<typeof SessionManifest>;

export const Frame = z.object({
  step: z.number(),
  timestamp: z.string(),
  screenshotPath: z.string(),
  domSnapshotPath: z.string(),
  url: z.string(),
  pageTitle: z.string(),
});
export type Frame = z.infer<typeof Frame>;

// ─── Config ────────────────────────────────────────────────

export const AgentConfig = z.object({
  llmProvider: z.enum(["openai", "anthropic", "deepseek"]).default("deepseek"),
  llmModel: z.string().default("deepseek-chat"),
  headless: z.boolean().default(false),
  maxRetries: z.number().default(3),
  maxSteps: z.number().default(50),
  sessionDir: z.string().default("./sessions"),
  browserbaseApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  deepseekApiKey: z.string().optional(),
});
export type AgentConfig = z.infer<typeof AgentConfig>;

// ─── Intervention ──────────────────────────────────────────

export const InterventionCommand = z.enum(["pause", "redirect", "resume", "takeover"]);
export type InterventionCommand = z.infer<typeof InterventionCommand>;

export const Intervention = z.object({
  command: InterventionCommand,
  message: z.string().optional(),
  timestamp: z.string(),
});
export type Intervention = z.infer<typeof Intervention>;

// ─── Task ──────────────────────────────────────────────────

export const AgentTask = z.object({
  id: z.string(),
  instruction: z.string(),
  maxSteps: z.number().optional(),
  maxRetries: z.number().optional(),
  artifacts: z.array(z.string()).optional(),
  createdAt: z.string(),
});
export type AgentTask = z.infer<typeof AgentTask>;

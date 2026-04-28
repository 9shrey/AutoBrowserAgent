// Mirror of shared/types.ts for dashboard consumption

export type ActionType =
  | "navigate" | "click" | "type" | "scroll"
  | "extract" | "wait" | "screenshot" | "done";

export interface BrowserAction {
  action: ActionType;
  url?: string;
  selector?: string;
  text?: string;
  coordinates?: [number, number];
  direction?: "up" | "down";
  amount?: number;
  submit?: boolean;
  fullPage?: boolean;
  ms?: number;
  schema?: string;
  summary?: string;
}

export interface Thought {
  step: number;
  timestamp: string;
  thought: string;
  confidence: number;
  nextAction: ActionType;
  reasoning: string;
}

export interface ActionResult {
  success: boolean;
  step: number;
  action: BrowserAction;
  result?: string;
  error?: string;
  urlAfter?: string;
  extractedData?: unknown;
  screenshotPath?: string;
}

export interface AgentStep {
  step: number;
  thought: Thought;
  action: BrowserAction;
  result: ActionResult;
  retries: number;
}

export type SessionStatus = "running" | "paused" | "completed" | "failed" | "intervened";

export interface SessionManifest {
  id: string;
  task: string;
  status: SessionStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  totalSteps: number;
  llmProvider: string;
  llmModel: string;
  artifacts?: string[];
  tags?: string[];
}

export interface Frame {
  step: number;
  timestamp: string;
  screenshotPath: string;
  domSnapshotPath: string;
  url: string;
  pageTitle: string;
}

export interface SessionData {
  manifest: SessionManifest;
  frames: Frame[];
  thoughts: Thought[];
  actions: ActionResult[];
}

export type InterventionCommand = "pause" | "redirect" | "resume" | "takeover";

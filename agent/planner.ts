import type { BrowserAction, Thought } from "../shared/types.js";
import { LLM_PROMPTS } from "../shared/constants.js";
import type { AgentConfig } from "../shared/types.js";

interface LLMResponse {
  thought: string;
  confidence: number;
  nextAction: BrowserAction;
  reasoning: string;
}

export async function planNextAction(
  config: AgentConfig,
  task: string,
  screenshotPath: string,
  pageContext: { url: string; title: string },
  step: number,
  maxSteps: number,
  previousActions: string[],
): Promise<Thought> {
  const prompt = LLM_PROMPTS.PLAN
    .replace("{task}", task)
    .replace("{url}", pageContext.url)
    .replace("{title}", pageContext.title)
    .replace("{step}", String(step))
    .replace("{maxSteps}", String(maxSteps))
    .replace("{previousActions}", previousActions.length ? previousActions.join("\n") : "none");

  const response = await callLLM(config, [
    { role: "system", content: LLM_PROMPTS.SYSTEM },
    { role: "user", content: prompt },
  ]);

  try {
    const parsed = JSON.parse(response) as LLMResponse;
    return {
      step,
      timestamp: new Date().toISOString(),
      thought: parsed.thought || "",
      confidence: clamp(parsed.confidence ?? 0.5, 0, 1),
      nextAction: parsed.nextAction.action,
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return {
      step,
      timestamp: new Date().toISOString(),
      thought: response,
      confidence: 0.3,
      nextAction: "done",
      reasoning: "Failed to parse structured response, defaulting to done",
    };
  }
}

export async function evaluateActionResult(
  config: AgentConfig,
  expectedOutcome: string,
  actualResult: string,
): Promise<{ success: boolean; shouldRetry: boolean; newApproach?: string }> {
  const prompt = LLM_PROMPTS.EVALUATE
    .replace("{expectedOutcome}", expectedOutcome)
    .replace("{actualResult}", actualResult);

  const response = await callLLM(config, [
    { role: "user", content: prompt },
  ]);

  try {
    return JSON.parse(response);
  } catch {
    return { success: true, shouldRetry: false };
  }
}

async function callLLM(
  config: AgentConfig,
  messages: { role: string; content: string }[],
): Promise<string> {
  if (config.llmProvider === "openai") {
    const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages,
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content;
  }

  if (config.llmProvider === "anthropic") {
    const apiKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.llmModel,
        max_tokens: 4096,
        messages,
      }),
    });
    const data = (await res.json()) as { content: [{ text: string }] };
    return data.content[0].text;
  }

  throw new Error(`Unknown LLM provider: ${config.llmProvider}`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

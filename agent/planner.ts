import type { BrowserAction, Thought, AgentConfig } from "../shared/types.js";
import { LLM_PROMPTS, DEEPSEEK_DEFAULTS, DEFAULTS } from "../shared/constants.js";

interface LLMResponse {
  thought: string;
  confidence: number;
  nextAction: BrowserAction;
  reasoning: string;
}

export async function planNextAction(
  config: AgentConfig,
  task: string,
  _screenshotPath: string,
  pageContext: { url: string; title: string },
  step: number,
  maxSteps: number,
  previousActions: string[],
  pageContent?: string,
): Promise<Thought> {
  const isVision = config.llmProvider === "openai" || config.llmProvider === "anthropic";
  const template = isVision ? LLM_PROMPTS.PLAN_VISION : LLM_PROMPTS.PLAN;
  const systemPrompt = isVision ? LLM_PROMPTS.SYSTEM_VISION : LLM_PROMPTS.SYSTEM;

  const content = pageContent ?? pageContext.title;
  const truncatedContent = content.slice(0, DEFAULTS.PAGE_TEXT_MAX_LENGTH);

  const prompt = template
    .replace("{task}", task)
    .replace("{url}", pageContext.url)
    .replace("{title}", pageContext.title)
    .replace("{step}", String(step))
    .replace("{maxSteps}", String(maxSteps))
    .replace("{previousActions}", previousActions.length ? previousActions.join("\n") : "none")
    .replace("{pageContent}", truncatedContent);

  const response = await callLLM(config, [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ]);

  try {
    const cleaned = cleanJSON(response);
    const parsed = JSON.parse(cleaned) as LLMResponse;
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
      thought: response.slice(0, 200),
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
    return JSON.parse(cleanJSON(response));
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

  if (config.llmProvider === "deepseek") {
    const apiKey = config.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

    const res = await fetch(`${DEEPSEEK_DEFAULTS.BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel || DEEPSEEK_DEFAULTS.MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DeepSeek API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content;
  }

  throw new Error(`Unknown LLM provider: ${config.llmProvider}`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cleanJSON(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

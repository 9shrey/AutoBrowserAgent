import type { BrowserAction, ActionResult, Thought } from "../shared/types.js";
import type { AgentConfig } from "../shared/types.js";
import { evaluateActionResult } from "./planner.js";

export interface CorrectionResult {
  shouldRetry: boolean;
  newApproach?: BrowserAction;
  reason: string;
}

export async function evaluateAndCorrect(
  config: AgentConfig,
  thought: Thought,
  action: BrowserAction,
  result: ActionResult,
  retryCount: number,
): Promise<CorrectionResult> {
  if (result.success) {
    return { shouldRetry: false, reason: "Action succeeded" };
  }

  if (retryCount >= config.maxRetries) {
    return {
      shouldRetry: false,
      reason: `Max retries (${config.maxRetries}) exceeded, moving on`,
    };
  }

  const evaluation = await evaluateActionResult(
    config,
    `Action: ${JSON.stringify(action)}, Expected: ${thought.reasoning}`,
    `Result: ${result.error ?? result.result}`,
  );

  if (evaluation.shouldRetry && retryCount < config.maxRetries) {
    const newAction = adaptActionForRetry(action, retryCount);
    return {
      shouldRetry: true,
      newApproach: newAction,
      reason: evaluation.newApproach ?? `Retry ${retryCount + 1}/${config.maxRetries}`,
    };
  }

  return { shouldRetry: false, reason: "Evaluation says no retry needed" };
}

function adaptActionForRetry(action: BrowserAction, retryCount: number): BrowserAction {
  switch (action.action) {
    case "click":
      if (action.selector) {
        const alternatives = [
          `a[href*="${action.selector.replace(/[.#]/g, "")}"]`,
          `button:has-text("${action.selector.replace(/[.#]/g, "")}")`,
          `[data-testid]`,
        ];
        return {
          ...action,
          selector: alternatives[Math.min(retryCount, alternatives.length - 1)],
        } as BrowserAction;
      }
      if (action.text && retryCount === 1) {
        return { ...action, selector: `*:has-text("${action.text}")` } as BrowserAction;
      }
      break;

    case "type":
      return {
        ...action,
        selector: action.selector.includes("input")
          ? action.selector
          : `input[name*="${action.selector.replace(/[.#]/g, "")}"], textarea[name*="${action.selector}"]`,
      } as BrowserAction;

    case "wait":
      return { ...action, ms: (action.ms ?? 2000) + 2000 * retryCount } as BrowserAction;
  }
  return action;
}

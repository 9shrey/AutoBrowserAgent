import type { ActionType, BrowserAction } from "../shared/types.js";

export interface ToolDefinition {
  name: ActionType;
  description: string;
  parameters: string;
  requiresSelector: boolean;
}

export const TOOL_REGISTRY: Record<ActionType, ToolDefinition> = {
  navigate: {
    name: "navigate",
    description: "Navigate the browser to a URL",
    parameters: '{ "url": "https://example.com" }',
    requiresSelector: false,
  },
  click: {
    name: "click",
    description: "Click an element by CSS selector, visible text content, or x,y coordinates",
    parameters:
      '{ "selector": ".button-class" } or { "text": "Click Me" } or { "coordinates": [100, 200] }',
    requiresSelector: true,
  },
  type: {
    name: "type",
    description: "Type text into an input field, optionally submitting the form",
    parameters: '{ "selector": "input[name=\\"q\\"]", "text": "search term", "submit": true }',
    requiresSelector: true,
  },
  scroll: {
    name: "scroll",
    description: "Scroll the page up/down by pixels or to a specific element",
    parameters: '{ "direction": "down", "amount": 500 } or { "selector": "#footer" }',
    requiresSelector: false,
  },
  extract: {
    name: "extract",
    description: "Extract structured data from the page or a specific element as JSON",
    parameters:
      '{ "schema": "array of {name, price, rating}" } or { "selector": "table.product-table" }',
    requiresSelector: false,
  },
  wait: {
    name: "wait",
    description: "Wait for a time duration or for a selector to appear",
    parameters: '{ "ms": 2000 } or { "selector": ".loaded-content" }',
    requiresSelector: false,
  },
  screenshot: {
    name: "screenshot",
    description: "Take a screenshot of the current viewport or full page",
    parameters: '{ "fullPage": true }',
    requiresSelector: false,
  },
  done: {
    name: "done",
    description: "Mark the task as complete with an optional summary",
    parameters: '{ "summary": "Extracted 5 product listings with prices" }',
    requiresSelector: false,
  },
};

export function formatToolsForLLM(): string {
  return Object.values(TOOL_REGISTRY)
    .map((t) => `- **${t.name}**: ${t.description}\n  Parameters: ${t.parameters}`)
    .join("\n");
}

export function validateAction(action: BrowserAction): { valid: boolean; error?: string } {
  const def = TOOL_REGISTRY[action.action];
  if (!def) return { valid: false, error: `Unknown action: ${action.action}` };

  if (def.requiresSelector) {
    const hasSelector =
      ("selector" in action && !!action.selector) || ("text" in action && !!action.text);
    if (!hasSelector)
      return { valid: false, error: `${action.action} requires a selector, text, or coordinates` };
  }

  if (action.action === "navigate" && !action.url) {
    return { valid: false, error: "navigate requires a URL" };
  }

  if (action.action === "type" && !action.text) {
    return { valid: false, error: "type requires text to input" };
  }

  return { valid: true };
}

export const DEFAULTS = {
  MAX_RETRIES: 3,
  MAX_STEPS: 50,
  STEP_TIMEOUT_MS: 30_000,
  SESSION_DIR: "./sessions",
  SCREENSHOT_QUALITY: 80,
  SCREENSHOT_FORMAT: "jpeg" as const,
  DOM_SNAPSHOT_MAX_DEPTH: 15,
  LLM_TEMPERATURE: 0.2,
  LLM_MAX_TOKENS: 4096,
  REPLAY_FRAME_BATCH_SIZE: 20,
  PAGE_TEXT_MAX_LENGTH: 6000,
} as const;

export const DEEPSEEK_DEFAULTS = {
  BASE_URL: "https://api.deepseek.com/v1",
  MODEL: "deepseek-chat",
} as const;

export const BROWSER_DEFAULTS = {
  VIEWPORT_WIDTH: 1280,
  VIEWPORT_HEIGHT: 800,
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  NAVIGATION_TIMEOUT: 30_000,
  ACTION_TIMEOUT: 10_000,
} as const;

export const LLM_PROMPTS = {
  SYSTEM: `You are an autonomous browser agent. Your job is to navigate the web to complete user tasks.

You can use these actions: navigate, click, type, scroll, extract, wait, screenshot, done.

For each step:
1. Read the page content provided (URL, title, and visible text)
2. Decide the best action to move toward the goal
3. Provide your reasoning and confidence (0-1)

Guidelines:
- Prefer clicking by visible text content over CSS selectors (more robust)
- Use "navigate" with full URLs when you need to go to a new page
- Scroll before extracting if content might be below the fold
- Extract structured data (prices, names, ratings) as JSON when collecting information
- Use "type" to fill form fields: {"action":"type","selector":"input[name='q']","text":"search term","submit":true}
- Use "click" by text: {"action":"click","text":"Click Me"} or by selector: {"action":"click","selector":".btn"}
- Use done when the task is complete; include a summary
- If a click doesn't work, try selector alternatives or scroll to find the element
- If you're stuck after 2 retries, try a different approach rather than repeating
- IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no extra text`,

  SYSTEM_VISION: `You are an autonomous browser agent with vision. Your job is to navigate the web to complete user tasks.

You can use these actions: navigate, click, type, scroll, extract, wait, screenshot, done.

For each step:
1. Look at the screenshot of the current page
2. Decide the best action to move toward the goal
3. Provide your reasoning and confidence (0-1)

Guidelines:
- Prefer clicking by visible text content over CSS selectors (more robust)
- Scroll before extracting if content might be below the fold
- Extract structured data (prices, names, ratings) as JSON when collecting information
- Use done when the task is complete; include a summary
- If a click doesn't work, try selector alternatives or scroll to find the element
- If you're stuck after 2 retries, try a different approach rather than repeating`,

  PLAN: `Current task: {task}
Current URL: {url}
Page title: {title}
Step {step} of {maxSteps}

Previous actions: {previousActions}

Page content:
{pageContent}

Based on the page content above, plan the next action. Return ONLY valid JSON (no markdown, no code block):
{
  "thought": "what you see and are thinking",
  "confidence": 0.0-1.0,
  "nextAction": { ... browser action ... },
  "reasoning": "why this action moves us toward the goal"
}`,

  PLAN_VISION: `Current task: {task}
Current URL: {url}
Page title: {title}
Step {step} of {maxSteps}

Previous actions: {previousActions}

Analyze the screenshot and plan the next action. Return JSON:
{
  "thought": "what you see and are thinking",
  "confidence": 0.0-1.0,
  "nextAction": { ... browser action ... },
  "reasoning": "why this action moves us toward the goal"
}`,

  EVALUATE: `Expected outcome: {expectedOutcome}
Actual result: {actualResult}

Did this action succeed? Should we retry, try differently, or move on?
Return JSON: { "success": true/false, "shouldRetry": true/false, "newApproach": "..." if retrying }`,
} as const;

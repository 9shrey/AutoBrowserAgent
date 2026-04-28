# AutoBrowserAgent — Autonomous Browser Agent with Live Replay Dashboard

## Project Overview

A web agent that autonomously browses the internet to complete user tasks (research, booking, form-filling), with a full session replay dashboard showing every action, thought, and DOM interaction as a playable recording.

The agent takes natural language instructions — e.g. "find me the best laptop under $1500 and add the top 3 to a comparison spreadsheet" — and executes them end-to-end via browser automation. Every session is recorded frame-by-frame (screenshots + DOM snapshots + agent thoughts) and playable in a Next.js dashboard with a timeline scrubber, thought-bubble overlays, and exportable artifacts.

## Core Architecture

```
User Task (NL)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Orchestrator (Agent Loop)                   │
│  perceive → plan → act → evaluate            │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Vision   │  │ Action   │  │ Self-       │  │
│  │ (screen) │  │ Planner  │  │ Correction  │  │
│  └──────────┘  └──────────┘  └────────────┘  │
│                                               │
│  ┌──────────────────────────────────────────┐ │
│  │         Browser Automation               │ │
│  │  Playwright / Browserbase                │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  ┌──────────────────────────────────────────┐ │
│  │         Session Recorder                 │ │
│  │  Screenshots + DOM snapshots + Thoughts  │ │
│  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Replay Dashboard (Next.js)                  │
│  Filmstrip · Timeline · Thought Bubbles      │
│  Artifacts Export · Human Intervention       │
└─────────────────────────────────────────────┘
```

## Tech Stack

| Component          | Technology                                      |
| ------------------ | ----------------------------------------------- |
| Browser Automation | Playwright, Browserbase                         |
| Agent Loop         | LLM + vision (GPT-4o / Claude), action planning |
| Recording          | Frame-by-frame screenshots + DOM snapshots      |
| Frontend           | Next.js, React, TailwindCSS                     |
| Replay UI          | Custom timeline scrubber, filmstrip view        |
| State Management   | Server-sent events (SSE) for live session feed  |
| Artifacts          | CSV/JSON export, screenshot gallery             |
| Intervention       | Human-in-the-loop pause/redirect via WebSocket  |

## Project Structure

```
AutoBrowserAgent/
├── agent/                    # Core agent loop
│   ├── orchestrator.ts       # perceive → plan → act → evaluate
│   ├── planner.ts            # LLM action planning (click, type, extract, scroll, navigate)
│   ├── executor.ts           # Playwright/Browserbase command execution
│   ├── vision.ts             # Screenshot + vision model interpretation
│   ├── self-correction.ts    # Error detection and recovery
│   └── tools.ts              # Available browser actions registry
├── recorder/                 # Session recording engine
│   ├── recorder.ts           # Frame capture, DOM snapshot, thought logger
│   ├── session-store.ts      # Session persistence (filesystem / S3)
│   └── types.ts              # Session, Frame, Thought, Action types
├── dashboard/                # Next.js replay dashboard
│   ├── pages/
│   │   ├── index.tsx         # Session list / history
│   │   ├── session/[id].tsx  # Replay view with timeline
│   │   └── api/
│   │       ├── sessions.ts   # Session CRUD API
│   │       ├── replay.ts     # Replay data streaming (SSE)
│   │       └── intervene.ts  # Human intervention endpoint
│   ├── components/
│   │   ├── Filmstrip.tsx     # Sidebar filmstrip view
│   │   ├── Timeline.tsx      # Timeline scrubber
│   │   ├── ThoughtBubble.tsx # Thought overlay at each step
│   │   ├── BrowserViewport.tsx # Main replay viewport
│   │   ├── ArtifactPanel.tsx # Export screenshots, CSVs, JSON
│   │   └── InterveneBar.tsx  # Pause/redirect controls
│   └── lib/
│       ├── session-client.ts # Session data fetching
│       └── replay-engine.ts  # Client-side replay controller
├── shared/                   # Shared types and utilities
│   ├── types.ts              # AgentTask, Session, Frame, Thought, Action
│   └── constants.ts          # Defaults, limits, config keys
├── demo/                     # Demo scripts and scenarios
│   └── headphone-research.ts # "Best noise-canceling headphones 2026" demo
└── CLAUDE.md                 # This file
```

## Agent Loop (Core Pattern)

The agent follows a strict perceive → plan → act → evaluate loop:

1. **Perceive** — Capture screenshot of current page state. Send to vision model for DOM understanding, extract interactive elements and page content.
2. **Plan** — LLM decides the next action from the available tool set: `click`, `type`, `scroll`, `navigate`, `extract`, `wait`, `screenshot`, `done`. Each plan step includes a `thought` (reasoning) and `confidence` score.
3. **Act** — Playwright/Browserbase executes the planned action. The action result (success/failure, new URL, extracted data) is captured.
4. **Evaluate** — Self-correction step: did the action produce the expected outcome? If not, replan and retry (max 3 retries per step). If stuck, flag for human intervention.

### Action Types (Tool Registry)

```
navigate  → go to URL
click     → click element by selector/text/coordinates
type      → type text into input field
scroll    → scroll page by amount or to element
extract   → extract structured data from current page (text, tables, prices)
wait      → wait for condition (time, selector, network idle)
screenshot → capture full-page or element screenshot
done      → task complete, return artifacts
```

## Session Recording

Every session captures:

- **Frames** — Full-page screenshot + compressed DOM snapshot at each step
- **Thoughts** — LLM reasoning at each plan step (what it sees, what it decided, why)
- **Actions** — The exact action taken, target element, and result
- **Artifacts** — Extracted data (CSV/JSON), final screenshots, generated files

Sessions are stored as timestamped directories with a manifest:

```
sessions/
└── 2026-04-28-headphone-research/
    ├── manifest.json          # Session metadata, task, status, duration
    ├── frames/
    │   ├── 00001.png          # Screenshot at step 1
    │   ├── 00001.dom.json     # DOM snapshot at step 1
    │   ├── 00002.png
    │   └── ...
    ├── thoughts.jsonl         # One thought per line: {step, timestamp, thought, confidence}
    ├── actions.jsonl          # One action per line: {step, action, target, result}
    └── artifacts/
        ├── comparison.csv     # Extracted data
        └── screenshots/       # Key screenshots for export
```

## Replay Dashboard Features

| Feature               | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| Session List          | History of all agent runs with status, duration, task summary  |
| Filmstrip View        | Vertical strip of screenshots, click to jump to step           |
| Timeline Scrubber     | Horizontal timeline with action markers, drag to scrub         |
| Thought Bubbles       | Overlaid on each frame showing what the agent was thinking     |
| Browser Viewport      | Main area showing current frame screenshot at recorded size    |
| Live Mode             | Watch agent work in real-time via SSE                          |
| Artifact Panel        | Download extracted CSV/JSON, screenshot gallery, copy to clipboard |
| Pause & Redirect      | Human-in-the-loop: pause agent, type instruction, resume       |

## Human-in-the-Loop Intervention

- **Pause** — Sends interrupt signal to agent via WebSocket. Agent finishes current action then waits.
- **Redirect** — Human types a correction or new instruction. Injected into agent's plan step.
- **Resume** — Agent continues from intervention point with new context.
- **Takeover** — Human manually performs an action in the replay browser; agent resumes from the new state.

## Demo Scenario

"Find me the best noise-canceling headphones of 2026 and build a comparison table across 5 review sites."

1. Agent navigates to Google, searches for "best noise-canceling headphones 2026"
2. Clicks top 5 review results (RTINGS, Wirecutter, SoundGuys, etc.)
3. On each page: scrolls, extracts product names, prices, ratings, pros/cons
4. Compiles structured comparison table
5. Exports CSV to artifacts
6. Entire session playable in dashboard with thought bubbles at each decision point

## Development Phases

### Phase 1 — Core Agent (Days 1-3)
- [ ] Playwright/Browserbase setup and headful browser control
- [ ] Tool registry: navigate, click, type, scroll, extract, screenshot
- [ ] LLM planner loop with vision (perceive → plan → act → evaluate)
- [ ] Basic self-correction (retry on failure, max 3 attempts)
- [ ] CLI interface: `npx tsx agent/run.ts "your task here"`

### Phase 2 — Session Recording (Days 4-5)
- [ ] Frame-by-frame screenshot capture
- [ ] DOM snapshot compression and storage
- [ ] Thought and action logging to JSONL
- [ ] Session manifest and artifact export
- [ ] Session file browser

### Phase 3 — Replay Dashboard (Days 6-8)
- [ ] Next.js app with session list and detail views
- [ ] Filmstrip sidebar component
- [ ] Timeline scrubber with action markers
- [ ] Thought bubble overlay on replay frames
- [ ] Artifact download panel (CSV, JSON, screenshots)
- [ ] Live mode via SSE (watch agent work in real-time)

### Phase 4 — Intervention & Polish (Days 9-10)
- [ ] WebSocket-based pause/redirect/resume
- [ ] Human takeover mode
- [ ] Demo script: headphone research + comparison table
- [ ] 90-second demo video recording
- [ ] README with setup instructions and architecture diagram

## Key Design Decisions

- **Screenshots over DOM-only recording** — Screenshots capture visual state exactly as the agent saw it, including hover states, modals, and dynamic content that DOM snapshots miss. DOM snapshots are supplementary for text extraction and element inspection.
- **SSE for live mode, polling for replay** — Live sessions stream frames via SSE for minimal latency. Replay fetches frame bundles on-demand as the user scrubs the timeline.
- **Filesystem session store for dev, S3 for prod** — Session data is large (screenshots). Local filesystem is fast for development; abstract behind `SessionStore` interface for S3 migration.
- **LLM-agnostic planner** — Planner accepts any OpenAI-compatible or Anthropic API. Vision calls use the same provider. Configurable via env vars.

## Environment Variables

```env
# LLM
OPENAI_API_KEY=           # OpenAI API key (for GPT-4o vision)
ANTHROPIC_API_KEY=        # Anthropic API key (for Claude vision)
LLM_PROVIDER=openai       # openai | anthropic
LLM_MODEL=gpt-4o          # gpt-4o | claude-sonnet-4-6 | claude-opus-4-7

# Browser
BROWSERBASE_API_KEY=      # Browserbase API key (optional, falls back to local Playwright)
HEADLESS=false            # Run browser headless (true for CI/sessions)

# Storage
SESSION_DIR=./sessions    # Local session storage path
S3_BUCKET=                # S3 bucket for session storage (optional)
S3_REGION=us-east-1

# Dashboard
NEXT_PUBLIC_WS_URL=ws://localhost:3001   # WebSocket for live mode + intervention
```

## Commands

```bash
# Run an agent task
npx tsx agent/run.ts "find me the best laptop under $1500"

# Run in headless mode with specific model
HEADLESS=true LLM_MODEL=claude-sonnet-4-6 npx tsx agent/run.ts "book a flight to NYC"

# Start replay dashboard (dev)
cd dashboard && npm run dev

# Run demo scenario
npx tsx demo/headphone-research.ts

# Export session artifacts
npx tsx agent/export.ts sessions/2026-04-28-headphone-research --format csv
```

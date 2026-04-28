# AutoBrowserAgent

**Autonomous LLM-powered browser agent with live session replay dashboard.** Give it a natural language task — *"find me the best noise-canceling headphones and build a comparison table"* — and it browses the web, extracts data, and completes the task while recording every step for replay.

<p align="center">
  <img src="https://img.shields.io/badge/agent-autonomous-blue" alt="Autonomous Agent">
  <img src="https://img.shields.io/badge/browser-playwright-green" alt="Playwright">
  <img src="https://img.shields.io/badge/llm-deepseek%20%7C%20openai%20%7C%20claude-purple" alt="LLM">
  <img src="https://img.shields.io/badge/dashboard-next.js-black" alt="Next.js">
  <img src="https://img.shields.io/badge/replay-session%20recording-orange" alt="Session Replay">
</p>

## Architecture

```
User Task (NL)
    │
    ▼
┌─────────────────────────────────────────┐
│  Agent Loop                              │
│  perceive → plan → act → evaluate        │
│                                           │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Page Text │  │  LLM    │  │ Auto-   │  │
│  │ or Vision │  │ Planner │  │ Correct │  │
│  └──────────┘  └─────────┘  └─────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  Playwright Browser Automation      │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  Session Recorder (frames+thoughts) │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Replay Dashboard (Next.js)              │
│  Filmstrip · Timeline · Thought Bubbles  │
│  Artifacts Export · Human Intervention   │
└─────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Clone
git clone https://github.com/9shrey/AutoBrowserAgent.git
cd AutoBrowserAgent

# 2. Install
npm install
cd dashboard && npm install && cd ..

# 3. Configure — copy .env.example to .env and add your API key
cp .env.example .env
# Add your DEEPSEEK_API_KEY to .env

# 4. Run a task with DeepSeek
npx tsx agent/run.ts "search for best mechanical keyboards under $200"
```

## LLM Providers

| Provider | Default Model | Vision? | Setup |
|----------|--------------|---------|-------|
| **DeepSeek** (default) | `deepseek-chat` | Text-based (DOM text extraction) | Set `DEEPSEEK_API_KEY` |
| **OpenAI** | `gpt-4o` | Vision (screenshots) | Set `OPENAI_API_KEY` |
| **Anthropic** | `claude-sonnet-4-6` | Vision (screenshots) | Set `ANTHROPIC_API_KEY` |

### DeepSeek Setup

```bash
# .env
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
DEEPSEEK_API_KEY=sk-your-key-here
```

DeepSeek uses text-based page perception — the agent extracts visible text from each page (headings, links, buttons, content) and sends it to the LLM for decision-making. This works well for most tasks (search, navigation, data extraction) without requiring vision capabilities.

## Usage

### CLI Agent

```bash
# Run any task
npx tsx agent/run.ts "find me 3 co-working spaces in Austin under $500/month"

# With custom model
LLM_MODEL=deepseek-reasoner npx tsx agent/run.ts "compare iPhone vs Pixel specs"

# Headless mode
HEADLESS=true npx tsx agent/run.ts "scrape the top 10 movies from IMDB"

# Export session data
npx tsx agent/export.ts sessions/task-abc123-2026-04-28 --format csv
```

### Demo Script (no API key needed)

```bash
npx tsx demo/headphone-research.ts
```

This runs a scripted demo that searches for noise-canceling headphones, visits review sites, and builds a comparison CSV/JSON — all without an LLM API key.

### Replay Dashboard

```bash
cd dashboard && npm run dev
# Open http://localhost:3000
```

The dashboard shows:
- **Session list** — all past agent runs with status, duration, step count
- **Filmstrip sidebar** — click any step to jump
- **Timeline scrubber** — drag to scrub through the session, with action markers (green = success, red = failed)
- **Thought bubbles** — the LLM's reasoning and confidence at each step
- **Browser viewport** — screenshots of what the agent saw
- **Artifact panel** — download extracted CSV/JSON data
- **Intervene bar** — pause the agent, type a new instruction, and resume

## Features

### Agent Loop
- **perceive → plan → act → evaluate** cycle with self-correction
- 8 action types: `navigate`, `click`, `type`, `scroll`, `extract`, `wait`, `screenshot`, `done`
- Adaptive retry logic: failed clicks try alternative selectors, timeouts increase, max 3 retries
- Human-in-the-loop: pause / redirect / resume / takeover mid-task

### Session Recording
- Frame-by-frame screenshots + DOM snapshots
- Thought JSONL: every LLM reasoning step with confidence scores
- Action JSONL: every browser action with results
- Auto-generated artifacts: extracted data as JSON + CSV

### Dashboard
- Dark-themed Next.js UI (no CSS framework)
- Timeline scrubber with action success/failure markers
- Collapsible thought bubbles showing LLM reasoning
- SSE-based live mode for watching agent in real-time
- WebSocket intervention API for pause/redirect

## Project Structure

```
AutoBrowserAgent/
├── agent/                     # Core agent loop
│   ├── orchestrator.ts        # perceive → plan → act → evaluate
│   ├── planner.ts             # LLM action planning (DeepSeek/OpenAI/Anthropic)
│   ├── executor.ts            # Playwright command execution
│   ├── vision.ts              # Screenshot capture + DOM snapshots
│   ├── self-correction.ts     # Error detection + adaptive retry
│   ├── tools.ts               # Action registry + validation
│   ├── run.ts                 # CLI entry point
│   └── export.ts              # Session → CSV/JSON export
├── recorder/                  # Session recording engine
│   ├── recorder.ts            # Session init, frame/thought/action logging
│   └── session-store.ts       # Session CRUD (list, load, delete)
├── dashboard/                 # Next.js replay dashboard
│   ├── pages/
│   │   ├── index.tsx          # Session list
│   │   ├── session/[id].tsx   # Replay view
│   │   └── api/               # sessions, replay (SSE), intervene, screenshots
│   ├── components/
│   │   ├── Filmstrip.tsx      # Step sidebar
│   │   ├── Timeline.tsx       # Drag-scrubbable timeline
│   │   ├── ThoughtBubble.tsx  # LLM reasoning overlay
│   │   ├── BrowserViewport.tsx# Screenshot display
│   │   ├── ArtifactPanel.tsx  # Download + metadata
│   │   └── InterveneBar.tsx   # Pause/redirect/resume controls
│   └── lib/                   # API client + replay engine
├── shared/                    # Zod types + constants
├── demo/
│   └── headphone-research.ts  # Scripted demo (no API key needed)
├── CLAUDE.md                  # Master project prompt
└── README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `deepseek` | `deepseek`, `openai`, or `anthropic` |
| `LLM_MODEL` | `deepseek-chat` | Model name (e.g. `deepseek-reasoner`, `gpt-4o`) |
| `DEEPSEEK_API_KEY` | — | DeepSeek API key |
| `OPENAI_API_KEY` | — | OpenAI API key (needed for vision) |
| `ANTHROPIC_API_KEY` | — | Anthropic API key (needed for vision) |
| `HEADLESS` | `false` | Run browser in headless mode |
| `SESSION_DIR` | `./sessions` | Where session data is stored |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Browser Automation | Playwright |
| Agent Loop | LLM (DeepSeek/OpenAI/Anthropic) + text perception or vision |
| Recording | Frame-by-frame screenshots + DOM snapshots |
| Dashboard | Next.js 15, React 19, TypeScript |
| Session Storage | Filesystem (JSONL + JPEG) with S3-ready abstraction |
| Replay | Timeline scrubber, filmstrip, thought bubbles |
| Intervention | REST API (pause/redirect/resume/takeover) |

## ATS Keywords

Autonomous Agent · Browser Automation · Playwright · LLM Agent · Agent Loop · Web Navigation · Self-Correction · Human-in-the-Loop · Session Replay · Screenshot Recording · DOM Interaction · Action Planning · Task Completion · Web Scraping · Replay Dashboard · Timeline Scrubber · Data Extraction · DeepSeek

## License

MIT

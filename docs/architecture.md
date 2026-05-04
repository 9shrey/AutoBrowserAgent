# AutoBrowserAgent Architecture

```mermaid
flowchart LR
    Task["Natural-language task"] --> Loop["Agent loop<br/>perceive, plan, act, evaluate"]
    Loop --> Perception["DOM text / screenshot perception"]
    Perception --> Planner["LLM planner"]
    Planner --> Executor["Playwright executor"]
    Executor --> Recorder["Session recorder<br/>frames, actions, thoughts"]
    Recorder --> Dashboard["Next.js replay dashboard"]
    Recorder --> Artifacts["CSV / JSON exports"]
    Dashboard --> Human["Human intervention<br/>pause, redirect, resume"]
    Human --> Loop
```

## Evidence Fixtures

Run the offline replay generator:

```bash
node examples/offline_replay_fixture.mjs
```

It writes a saved session under `examples/saved_sessions/shopping-comparison/` plus exported artifacts under `results/shopping-comparison/`.

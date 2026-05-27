# OpenClaw / openclaw-zero-token CLI Architecture Flow

This document describes the main path from **command line entry** to **subcommand execution** in this repository, for reference against the source code (`openclaw.mjs`, `entry.ts`, `cli/`). For the upstream OpenClaw high-level architecture overview, see the root `ARCHITECTURE.md`.

## Diagram Notes

- **Solid lines**: main flow; **Dashed lines**: on-demand loading (lazy subcommand registration) or async branches.
- **Exit codes**: `0` success; `1` general error (validation failure, runtime failure); `2` root-level argument parsing error (e.g., invalid `--container` / `--profile` combination); if Node version is too low, `openclaw.mjs` directly calls `exit(1)`.
- **Zero Token**: `onboard` / `configure` and similar flows can trigger `src/zero-token/providers/*` with Playwright/CDP to send requests to various vendors' **web APIs**; credentials are saved as `auth.json` etc. in the state directory (do not commit to version control).

```mermaid
flowchart TD
  subgraph Entry["Entry"]
    A["openclaw.mjs<br/>Verify Node >= 22.12"] --> B{"dist/entry.(m)js exists?"}
    B -->|No| E1["Error: missing dist/entry<br/>exit 1"]
    B -->|Yes| C["entry.js: normalize argv<br/>optional respawn child process"]
  end

  C --> D{"Container mode<br/>--container?"}
  D -->|Parse failed| X2["stderr prompt<br/>exit 2"]
  D -->|Yes| DC["Inside Podman/Docker<br/>re-execute CLI"]
  D -->|No| P{"--profile / --dev?"}
  P -->|Parse failed| X2
  P -->|Yes| PE["Write profile isolation<br/>STATE/CONFIG env vars"]
  P -->|No| V{"Only --version / -V / -v?"}
  V -->|Yes| VF["Output version + optional commit<br/>exit 0"]
  V -->|No| H{"Only --help / -h?"}
  H -->|Yes| HF["outputRootHelp<br/>exit 0"]
  H -->|No| R["runCli: Commander Program"]

  subgraph Run["runCli / Commander"]
    R --> PL["Plugin discovery & registration<br/>(extensions / plugins.allow)"]
    PL --> REG["registerProgramCommands<br/>Core command placeholders + lazy loading"]
    REG --> DISPATCH{"Match subcommand"}
  end

  DISPATCH -->|onboard / configure / setup| WZ["Wizard + config write<br/>openclaw.json / auth"]
  DISPATCH -->|gateway / daemon| GW["Gateway process / RPC<br/>WebSocket + HTTP"]
  DISPATCH -->|agent / tui| AG["Via Gateway or TUI<br/>Call models & tools"]
  DISPATCH -->|models / channels / ...| SUB["Each cli/* module<br/>Read config / Call services"]
  DISPATCH -->|doctor| DOC["Health check & repair suggestions<br/>Can exit 0 but with warnings"]
  DISPATCH -->|Unknown or param error| ERR["Commander error info<br/>Usually exit 1"]

  WZ --> BROWSER["Playwright / Chrome CDP<br/>(Zero Token web login)"]
  WZ --> FS1["File I/O: config & auth storage"]
  GW --> NET["Local port / External HTTP"]
  AG --> NET
  AG --> API["Provider: web API or<br/>OpenAI compatible / local Ollama etc."]
  SUB --> FS2["Read/write config & state directory"]
  SUB --> NET

  style E1 fill:#f99
  style X2 fill:#f99
  style ERR fill:#f99
  style VF fill:#9f9
  style HF fill:#9f9
```

## Source Code Map

| Phase | Main File |
| ------------------------- | ---------------------------------------------------------------------- |
| Bootstrap wrapper | `openclaw.mjs` |
| Process entry, version/help fast path | `entry.ts` |
| CLI main loop | `cli/run-main.ts` → `cli/program/*` |
| Core subcommand registration | `cli/program/command-registry.ts` |
| Extension subcommands | `cli/program/register.subclis.ts`、`cli/program/subcli-descriptors.ts` |
| Zero Token web side | `src/zero-token/providers/`、`src/zero-token/streams/` |

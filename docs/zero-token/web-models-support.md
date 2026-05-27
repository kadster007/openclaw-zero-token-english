# Web Models Support (Zero-Token)

This document describes the architecture of OpenClaw Web model support.

## Overview

OpenClaw Zero-Token supports using Web models (e.g. ChatGPT Web, Claude Web, DeepSeek Web, etc.) authenticated through browser sessions, requiring no API Key.

## Architecture

### Directory Boundary (`src/zero-token/`)

Web model implementation is concentrated in **`src/zero-token/`**, separated from other OpenClaw core areas for easier diff review during fork and upstream sync.

```
┌─────────────────────────────────────────────────────────────┐
│ OpenClaw Core (synced with upstream)                        │
│ • resolveImplicitProviders() etc. (still holds buildXxxWebProvider) │
│ • Thin bridges: `src/agents/web-stream-factories.ts` → re-export   │
│ • CLI: `onboard-web-auth` / `auth-choice` → import zero-token │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ src/zero-token/                                              │
│ • providers/ — *-web-client*、*-web-auth                     │
│ • streams/ — *-web-stream.ts、web-stream-factories.ts        │
└─────────────────────────────────────────────────────────────┘
```

### Core Files

| File                                        | Description                           |
| ------------------------------------------- | ------------------------------------- |
| `src/zero-token/providers/*.ts`             | Browser clients and Web login helpers |
| `src/zero-token/streams/*.ts`               | Web stream factories and registry     |
| `src/agents/web-stream-factories.ts`        | Stable re-export of `zero-token/streams` |
| `src/agents/models-config.providers.ts`     | Implicit provider merging (including Web section) |

### Supported Providers

| Provider ID  | Name                |
| ------------ | ------------------- |
| chatgpt-web  | ChatGPT Web         |
| claude-web   | Claude Web          |
| deepseek-web | DeepSeek Web        |
| doubao-web   | Doubao Web          |
| gemini-web   | Gemini Web          |
| glm-web      | GLM Web (China)     |
| glm-intl-web | GLM Web (International) |
| grok-web     | Grok Web            |
| kimi-web     | Kimi Web            |
| qwen-web     | Qwen Web (Alibaba China) |
| qwen-cn-web  | Qwen Web (Alibaba International) |
| manus-api    | Manus API           |

## Selecting a Web Model in Chat (`/model`)

Control UI chat box supports `/model` to switch models. For **Claude Web** it is recommended to write the full **provider + model ID**, e.g.:

```text
/model claude-web/claude-sonnet-4-6
```

This matches the default model ID in `src/zero-token/bridge/web-providers.ts`; writing `/model claude-web` alone may not resolve correctly in some environments. The same applies to other Web providers — use `/models` to see the full list, then `/model <provider>/<model-id>`.

## Authentication Flow

### Method 1: webauth command

```bash
# Launch Chrome in debug mode
./start-chrome-debug.sh

# Run authorization command
pnpm openclaw webauth
```

After the wizard prints "Authorization complete" or per-platform success messages, you can end the authorization. If the terminal **does not return a prompt**, press **Ctrl+C** to exit (credentials are typically already written before exit; if unsure, check `auth-profiles.json` / `openclaw.json`).

### Method 2: onboard command

```bash
pnpm openclaw onboard
```

### Chrome Debug Mode Configuration

Ensure the correct CDP port is configured in `~/.openclaw/openclaw.json`:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "defaultProfile": "chrome",
    "profiles": {
      "chrome": {
        "cdpPort": 9222,
        "attachOnly": true
      }
    }
  }
}
```

## Upstream Sync

1. **Upstream OpenClaw**: when merging/rebaseing, prioritize resolving conflicts outside `src/zero-token/`.
2. **Zero Token surface**: concentrated in `src/zero-token/` and a few bridge files (`web-stream-factories` re-export, `onboard-web-auth` import, Web-related sections in `models-config`).

## Troubleshooting

### Chrome Not Found

If `start-chrome-debug.sh` reports that Chrome is not found, check:

- Whether Chrome is installed
- Whether the path detection in the script covers your installation location

### Authorization Failed - Token Expired

If you see a "Session detected but token expired" error, it means the browser session exists but the API token has expired. You need to log in again.

### Port Error

If you see a "Failed to resolve Chrome WebSocket URL" error, check:

- Whether `cdpPort` in the config matches the Chrome debug port that was launched
- Chrome debug port defaults to 9222

## Development Guide

### Adding a New Web Provider

1. Add client and `*-web-auth.ts` in `src/zero-token/providers/`
2. Add `*-web-stream.ts` in `src/zero-token/streams/`, and register `model.api` in `web-stream-factories.ts`
3. Add `buildXxxWebProvider` and `resolveImplicitProviders` entries in `src/agents/models-config.providers.ts` (and `MODEL_APIS` if a new `api` is needed)
4. Register login function in `src/commands/onboard-web-auth.ts` (and `auth-choice.apply.*` as needed)

---

## AskOnce Plugin

### Overview

AskOnce is a standalone plugin that provides the ability to get answers from all large models with a single query.

### Plugin Structure

```
src/zero-token/extensions/askonce/
├── openclaw.plugin.json
├── package.json
└── src/
    ├── index.ts          # Plugin main entry, registers CLI
    ├── cli.ts            # CLI command implementation
    └── askonce/          # Core logic
        ├── query-orchestrator.ts
        ├── concurrent-engine.ts
        ├── adapters/      # Model adapters
        ├── formatters/   # Output formatting
        ├── types.ts
        ├── constants.ts
        └── index.ts
```

### Usage

```bash
# Ask a question
pnpm openclaw askonce "your question"

# Specify models
pnpm openclaw askonce "your question" -m claude-web,deepseek-web

# List available models
pnpm openclaw askonce --list

# Output Markdown
pnpm openclaw askonce "your question" -o markdown

# Output JSON
pnpm openclaw askonce "your question" -o json
```

### Upstream Sync

1. **Core code**: can be synced directly, no modifications needed
2. **AskOnce plugin**: `src/zero-token/extensions/askonce/` maintained alongside Web implementation
3. **plugin-sdk**: adding new type exports requires updating `src/plugin-sdk/askonce.ts`

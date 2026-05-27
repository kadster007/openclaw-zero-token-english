# Web Model Architecture

## Overview

Web models (also called "Zero Token" models) are LLM services accessed through browser Cookie/Session authentication rather than API keys. Examples: DeepSeek Web, Claude Web, ChatGPT Web, etc.

## Core Design Principles

1. **Non-Plugin Architecture**: Web models are not OpenClaw Plugins and do not use the `ProviderPlugin.createStreamFn()` plugin system
2. **Independent Stream Factories**: Each web provider has its own `createXXXWebStreamFn` factory function
3. **Separate Credential Storage**: Cookie/Session are stored in `auth-profiles.json`, not through OpenClaw upstream config
4. **Allowlist Gate**: User visibility is controlled by the `agents.defaults.models` allowlist

## Authorization Flow

```
User runs onboard-web-auth command
  │
  ├─► Wizard shows 13 selectable Web models
  │     └─► WEB_MODEL_PROVIDERS list defines each model's loginFn
  │
  ├─► Calls provider.loginFn()
  │     └─► Each provider's login function (loginDeepseekWeb, etc.)
  │           ├─► Opens browser login page (Puppeteer/manual)
  │           └─► Extracts cookies / session token
  │
  ├─► Saves credentials to auth-profiles.json
  │     Path: {OPENCLAW_STATE_DIR}/auth-profiles.json
  │     Format: { profiles: { "deepseek-web:default": { type: "token", token: "..." } } }
  │
  └─► Adds model to allowlist
        openclaw.json: agents.defaults.models: { "deepseek-web/deepseek-chat": { alias: "DeepSeek V3" } }
```

## Model Catalog Loading Flow

For a model to appear in the UI model list, it goes through the following pipeline:

```
loadModelCatalog()
  │
  ├─1─► pi-sdk ModelRegistry
  │     Reads agentDir/models.json
  │     Only includes upstream-supported models (no web models)
  │
  ├─2─► mergeConfiguredOptInProviderModels()
  │     Reads models.providers
  │     NON_PI_NATIVE_MODEL_PROVIDERS = {deepseek, kilocode}
  │     ⚠️ Does NOT read agents.defaults.models allowlist
  │
  ├─3─► mergeWhitelistedWebModels()  ← NEW in ZERO TOKEN
  │     Reads agents.defaults.models allowlist
  │     For each "provider/modelId" entry:
  │       ├─► If provider is isWebProvider() → synthesizes ModelCatalogEntry
  │       └─► Looks up metadata from KNOWN_WEB_MODEL_ENTRIES
  │
  └─4─► augmentModelCatalogWithProviderPlugins()
        Reads plugin-provided models (web models not included)
```

## Message Sending Flow (Core Path)

```
User selects deepseek-web/deepseek-chat, sends message
  │
  ▼
resolveConfiguredModelRef(cfg, "deepseek-web/deepseek-chat")
  ├─► Checks agents.defaults.models allowlist ✓ (alias: "DeepSeek V3")
  └─► Checks models.providers → finds baseUrl=https://chat.deepseek.com
  → Returns ModelRef { provider, modelId, baseUrl }

  ▼
attempt.ts: resolveEmbeddedAgentStreamFn()
  ├─► registerProviderStreamForModel({ model, cfg, agentDir })
  │     ├─► resolveProviderStreamFn(provider) → plugin system → undefined (web model is not a plugin)
  │     │
  │     └─► Falls back to:
  │           ├─► getWebStreamFactory(model.api) → "deepseek-web"
  │           │     └─► Mapping table web-stream-factories.ts
  │           │           → createDeepseekWebStreamFn ✓
  │           ├─► Reads credentials from auth-profiles.json
  │           │     └─► "deepseek-web:default" → { type:"token", token:"..." }
  │           └─► Calls createDeepseekWebStreamFn(credential) → StreamFn
  │
  ▼
StreamFn(model, context) is called
  ├─► DeepSeekWebClient.init() — initializes HTTP client with cookie
  ├─► client.createChatSession() — creates server-side session → gets sessionId
  ├─► client.sendMessage(sessionId, prompt) — sends message
  │     └─► Returns SSE stream (Server-Sent Events)
  └─► Converts SSE to pi-ai AssistantMessageEvent format
        ├─► thinking event (thinking process)
        ├─► text event (reply text)
        └─► tool_result event (tool call result)

  ▼
attempt.ts processes events → forwards to frontend WebSocket
  ▼
Web UI renders reply
```

## Key Files

| File                                             | Responsibility                                      |
| ------------------------------------------------ | --------------------------------------------------- |
| `src/zero-token/providers/*-web-auth.ts`         | Login functions for each model (get cookies)        |
| `src/agents/auth-profiles.ts`                    | Credential read/write (auth-profiles.json)           |
| `src/zero-token/streams/*-web-stream.ts`         | StreamFn implementation for each model              |
| `src/zero-token/streams/web-stream-factories.ts` | model.api → StreamFn factory mapping table          |
| `src/agents/web-stream-factories.ts`             | Bridge module (stable import path)                  |
| `src/agents/provider-stream.ts`                  | Core: resolveProviderStreamFn + fallback            |
| `src/agents/model-catalog.ts`                    | `mergeWhitelistedWebModels()` injects allowlist into catalog |
| `src/commands/onboard-web-auth.ts`               | CLI auth wizard                                     |

## Local Project Adaptation Status

### Fixed ✅

1. **`provider-stream.ts`** — Added fallback branch to get web model StreamFn from `getWebStreamFactory()` + auth-profiles
2. **`web-stream-factories.ts`** — Bridge module already exists
3. **`model-catalog.ts`** — Added `KNOWN_WEB_PROVIDER_IDS`, `isWebProvider()`, `mergeWhitelistedWebModels()`
4. **Config** — Removed web provider entries with invalid api types from `models.providers` (avoids schema errors)

### Prerequisites ✅

1. **auth-profiles.json** — Credentials for each web provider (`type: "token"`)
2. **openclaw.json** — `agents.defaults.models` allowlist includes web models
3. **web-stream-factories.ts** — Factory functions for all 13 providers registered

### Verification Results

```
stage=registry-read entries=781          ← pi-sdk native models
stage=configured-models-merged entries=779  ← filtered deepseek (NON_PI_NATIVE)
stage=whitelisted-web-models-merged entries=796  ← +17 web models
stage=plugin-models-merged entries=798
stage=complete entries=798
```

## Notes

1. **Do not register web providers in models.providers** — schema validation rejects invalid `api` values
2. **Avoid sending messages too frequently** — web models use real accounts; frequent requests may lead to account bans
3. **StreamFn fallback** — this is the zero-token core mechanism; the plugin system is invisible to web models
4. **Session reuse** — deepseek-web-stream, etc. use `sessionMap` to reuse chat sessions, avoiding excessive session creation

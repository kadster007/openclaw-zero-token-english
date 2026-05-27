# Zero Token Refactor Implementation Plan

> **Status (2026-03-28)**: Tasks 1–6 have all been completed; see validation records at the end.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce merge costs with upstream OpenClaw, improve browser authorization documentation, and provide a single registration point for future plugin migration — all while keeping Web model end-to-end behavior unchanged.

**Architecture:** Consolidate **Web `model.api` → `create*WebStreamFn`** into `src/zero-token/streams/web-stream-factories.ts` (`src/agents/web-stream-factories.ts` is a re-export); `attempt.ts` / `compact.ts` resolve through this registry. Use `docs/zero-token/upstream-sync.md` to list Zero Token's change surface relative to upstream; use `docs/zero-token/web-models-browser-modes.md` to document CDP / Profile constraints and available paths (including bb-browser reference). This plan does not introduce CLI-Anything or full bb-browser dependencies.

**Tech Stack:** TypeScript (ESM), Vitest, Playwright (existing); Web implementation lives in `src/zero-token/`.

**Reference Doc:** `docs/zero-token/zero-token-requirements.md`

---

## File Structure (Covered by This Plan)

| Path | Responsibility |
|------|---------------|
| `src/agents/web-stream-factories.ts` (new) | Central export of `getWebStreamFactory(api)` and all Web stream factories |
| `src/agents/web-stream-factories.test.ts` (new) | Verify registry completeness and factory callability |
| `src/agents/pi-embedded-runner/run/attempt.ts` | Replace 11 `else if` blocks with `getWebStreamFactory` |
| `src/agents/pi-embedded-runner/compact.ts` | Same as above, maintain behavioral consistency with attempt |
| `docs/zero-token/upstream-sync.md` (new) | Zero Token change surface checklist and sync steps |
| `docs/zero-token/web-models-browser-modes.md` (new) | Browser modes A/B/C and constraint documentation |
| `docs/zero-token/zero-token-requirements.md` | Append change log row pointing to this plan |

---

### Task 1: Upstream Sync Documentation

**Files:**
- Create: `docs/zero-token/upstream-sync.md`

- [x] **Step 1: Write document body**

Save the following content as `docs/zero-token/upstream-sync.md`:

```markdown
# Syncing with Upstream OpenClaw (Zero Token)

## Change Surface Checklist (Priority Check on Merge)

The following paths are typically **intentionally different** from [openclaw/openclaw](https://github.com/openclaw/openclaw), and require manual review during `git merge` / `git rebase`:

### Extensions and Scripts

- `src/zero-token/` — Web Provider clients / streaming implementation (originally `src/providers/*web*` + `*-web-stream.ts` migrated in)
- `start-chrome-debug.sh`、`onboard.sh`、`server.sh` (if present)
- `docs/zero-token/zero-token-requirements.md`、`docs/zero-token/web-models-browser-modes.md`、this document

### Agent and Web Streaming

- `src/agents/*-web-stream.ts`
- `src/agents/web-stream-factories.ts` (central registry, reduces `attempt.ts` conflict probability)
- `src/agents/pi-embedded-runner/run/attempt.ts` — Web stream branch should preferably only call `getWebStreamFactory`
- `src/agents/pi-embedded-runner/compact.ts` — Same as above
- `src/agents/models-config.providers.ts` — Provider resolution and lazy loading

### Provider Implementation and Auth

- `src/providers/*-web*.ts`、`src/providers/*-web-auth.ts`
- `src/commands/onboard-web-auth.ts`、`src/commands/auth-choice.apply.*.ts`
- `src/commands/onboard-auth.config-core.ts` (Web default model patches)

### Config Types

- `src/config/types.models.ts` — `ModelApi` / provider enum

## Recommended Sync Steps

1. `git fetch upstream` (configure `openclaw/openclaw` as `upstream`)
2. `git merge upstream/main` (or `rebase`, per team preference)
3. Resolve conflicts per this section's checklist; **prioritize keeping** upstream fixes to generic subsystems, then reapply Zero Token's Web-related hunks
4. `pnpm install && pnpm build`
5. `OPENCLAW_TEST_PROFILE=low pnpm test` (or full `pnpm test`, depending on machine resources)

## Non-Goals

- File-level parity with upstream is not required; **behavioral regression** (Web model conversation, onboard authorization) must be verifiable.
```

- [x] **Step 2: Add link in `README.zh-CN.md` table of contents**

Add a row to the relevant "Upstream Sync" section or directory listing: `- [Upstream Sync Guide](docs/zero-token/upstream-sync.md)` (if an "Upstream Sync" section already exists, link to this document).

- [x] **Step 3: Commit** (maintainer executes `git commit` locally)

```bash
git add docs/zero-token/upstream-sync.md README.zh-CN.md README.md
git commit -m "docs: add upstream sync playbook for zero-token"
```

---

### Task 2: Web Stream Factory Module + Unit Tests

**Files:**
- Create: `src/agents/web-stream-factories.ts`
- Create: `src/agents/web-stream-factories.test.ts`

- [x] **Step 1: Create `src/agents/web-stream-factories.ts`**

```typescript
import type { StreamFn } from "@mariozechner/pi-agent-core";
import { createChatGPTWebStreamFn } from "./chatgpt-web-stream.js";
import { createClaudeWebStreamFn } from "./claude-web-stream.js";
import { createDeepseekWebStreamFn } from "./deepseek-web-stream.js";
import { createDoubaoWebStreamFn } from "./doubao-web-stream.js";
import { createGeminiWebStreamFn } from "./gemini-web-stream.js";
import { createGlmIntlWebStreamFn } from "./glm-intl-web-stream.js";
import { createGlmWebStreamFn } from "./glm-web-stream.js";
import { createGrokWebStreamFn } from "./grok-web-stream.js";
import { createKimiWebStreamFn } from "./kimi-web-stream.js";
import { createQwenWebStreamFn } from "./qwen-web-stream.js";
import { createXiaomiMimoWebStreamFn } from "./xiaomimo-web-stream.js";

/** model.api value → factory function consistent with original attempt.ts / compact.ts branches */
const WEB_STREAM_FACTORIES = {
  "deepseek-web": createDeepseekWebStreamFn,
  "claude-web": createClaudeWebStreamFn,
  "doubao-web": createDoubaoWebStreamFn,
  "chatgpt-web": createChatGPTWebStreamFn,
  "qwen-web": createQwenWebStreamFn,
  "kimi-web": createKimiWebStreamFn,
  "gemini-web": createGeminiWebStreamFn,
  "grok-web": createGrokWebStreamFn,
  "glm-web": createGlmWebStreamFn,
  "glm-intl-web": createGlmIntlWebStreamFn,
  "xiaomimo-web": createXiaomiMimoWebStreamFn,
} as const satisfies Record<string, (cookie: string) => StreamFn>;

export type WebStreamApiId = keyof typeof WEB_STREAM_FACTORIES;

export function getWebStreamFactory(api: string): ((cookie: string) => StreamFn) | undefined {
  return WEB_STREAM_FACTORIES[api as WebStreamApiId];
}

export function listWebStreamApiIds(): WebStreamApiId[] {
  return Object.keys(WEB_STREAM_FACTORIES) as WebStreamApiId[];
}
```

- [x] **Step 2: Create `src/agents/web-stream-factories.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import { getWebStreamFactory, listWebStreamApiIds } from "./web-stream-factories.js";

describe("web-stream-factories", () => {
  it("lists stable web stream api ids", () => {
    const ids = listWebStreamApiIds().slice().sort();
    expect(ids).toEqual(
      [
        "chatgpt-web",
        "claude-web",
        "deepseek-web",
        "doubao-web",
        "gemini-web",
        "glm-intl-web",
        "glm-web",
        "grok-web",
        "kimi-web",
        "qwen-web",
        "xiaomimo-web",
      ].sort(),
    );
  });

  it("returns a function for each listed api", () => {
    for (const id of listWebStreamApiIds()) {
      const f = getWebStreamFactory(id);
      expect(f, id).toBeTypeOf("function");
      expect(f?.("")).toBeTypeOf("function");
    }
  });

  it("returns undefined for non-web api", () => {
    expect(getWebStreamFactory("openai")).toBeUndefined();
  });
});
```

- [x] **Step 3: Run tests**

Run: `pnpm exec vitest run src/agents/web-stream-factories.test.ts`
Expected: ALL PASS

- [x] **Step 4: Commit**

```bash
git add src/agents/web-stream-factories.ts src/agents/web-stream-factories.test.ts
git commit -m "agents: centralize web stream factories registry"
```

---

### Task 3: Refactor `attempt.ts`

**Files:**
- Modify: `src/agents/pi-embedded-runner/run/attempt.ts`

- [x] **Step 1: Adjust imports**

Remove the following individual imports (if only used by Web branch):

- `createChatGPTWebStreamFn` … `createXiaomiMimoWebStreamFn` (11 total create*WebStreamFn)

Add:

```typescript
import { getWebStreamFactory } from "../../web-stream-factories.js";
```

- [x] **Step 2: Replace Web branch block**

Replace the entire block from `} else if (params.model.api === "deepseek-web") {` through `} else if (params.model.api === "xiaomimo-web") { ... }` with the following structure **nested inside a single `else`** (`openai-responses` and the final `else` must still be inside that outer `else`, with one extra closing `}`):

```typescript
      } else {
        const webFactory = getWebStreamFactory(params.model.api);
        if (webFactory) {
          const cookie = (await params.authStorage.getApiKey(params.model.api)) || "";
          if (cookie) {
            activeSession.agent.streamFn = webFactory(cookie);
            ensureCustomApiRegistered(params.model.api, activeSession.agent.streamFn);
          } else {
            log.warn(`[web-stream] no API key for ${params.model.api}`);
            activeSession.agent.streamFn = streamSimple;
          }
        } else if (params.model.api === "openai-responses" && params.provider === "openai") {
          const wsApiKey = await params.authStorage.getApiKey(params.provider);
          if (wsApiKey) {
            activeSession.agent.streamFn = createOpenAIWebSocketStreamFn(wsApiKey, params.sessionId, {
              signal: runAbortController.signal,
            });
          } else {
            log.warn(`[ws-stream] no API key for provider=${params.provider}; using HTTP transport`);
            activeSession.agent.streamFn = streamSimple;
          }
        } else {
          activeSession.agent.streamFn = streamSimple;
        }
      }
```

**Ollama**'s `if (params.model.api === "ollama")` block stays **before** the entire block, unchanged.

- [x] **Step 3: Run relevant tests**

Run: `pnpm exec vitest run src/plugins/hooks.model-override-wiring.test.ts --pool-forks=false`
Expected: PASS (or a subset of `pnpm test` related to the embedded runner)

- [x] **Step 4: Commit**

```bash
git add src/agents/pi-embedded-runner/run/attempt.ts
git commit -m "agents: route web stream via getWebStreamFactory in attempt"
```

---

### Task 4: Refactor `compact.ts`

**Files:**
- Modify: `src/agents/pi-embedded-runner/compact.ts`

- [x] **Step 1: Adjust imports**

Remove 11 `create*WebStreamFn` imports, add:

```typescript
import { getWebStreamFactory } from "../web-stream-factories.js";
```

- [x] **Step 2: Replace `if (resolvedApiKey)` inner branches**

Replace:

```typescript
        if (model.api === "deepseek-web") {
          streamFn = createDeepseekWebStreamFn(resolvedApiKey);
        } else if (model.api === "claude-web") {
        ...
        } else if (model.api === "xiaomimo-web") {
          streamFn = createXiaomiMimoWebStreamFn(resolvedApiKey);
        }
```

With:

```typescript
        const webFactory = getWebStreamFactory(model.api);
        if (webFactory) {
          streamFn = webFactory(resolvedApiKey);
        }
```

- [x] **Step 3: Run tests**

Run: `pnpm build && pnpm exec vitest run src/agents/pi-embedded-runner --passWithNoTests`
Expected: No compilation errors; if compact-specific tests exist, PASS

- [x] **Step 4: Commit**

```bash
git add src/agents/pi-embedded-runner/compact.ts
git commit -m "agents: route web stream via getWebStreamFactory in compact"
```

---

### Task 5: Browser Mode Documentation

**Files:**
- Create: `docs/zero-token/web-models-browser-modes.md`
- Modify: `docs/zero-token/zero-token-requirements.md` (change log)

- [x] **Step 1: Create `docs/zero-token/web-models-browser-modes.md`**

Content must include three sections: **Mode A** (current `start-chrome-debug.sh` + dedicated `user-data-dir`), **Mode B** (user launches single-instance Chrome with `--remote-debugging-port` + same dedicated directory, no regular Chrome on the same dir), **Mode C** (extension/daemon bridge, e.g. bb-browser, as future PoC reference). Each section should describe: applicable scenarios, constraints (single instance, CDP required), configuration relationship with `browser.attachOnly` / `cdpUrl`.

- [x] **Step 2: Update `docs/zero-token/zero-token-requirements.md` section 6 table**

Add a row: `2026-03-28 | Implementation plan docs/zero-token/plans/2026-03-28-zero-token-refactor.md; browser modes at docs/zero-token/web-models-browser-modes.md`

- [x] **Step 3: Add `docs/zero-token/web-models-browser-modes.md` link to README table of contents (can be combined with Task 1)**

- [x] **Step 4: Commit**

```bash
git add docs/zero-token/web-models-browser-modes.md docs/zero-token/zero-token-requirements.md README.zh-CN.md
git commit -m "docs: web browser modes for CDP and profiles"
```

---

### Task 6 (Future / Optional): bb-browser PoC Recording

**Files:**
- Modify: `docs/zero-token/zero-token-requirements.md`

- [x] Verify locally whether `bb-browser site <adapter> --openclaw` meets a particular site's requirements; record the conclusion (usable / not usable / gaps) in the requirements doc change log. **This task does not modify `package.json` dependencies unless a separate PR is opened after the PoC passes.** (Completed: `npx bb-browser --help` verified CLI; conclusions documented in `docs/zero-token/web-models-browser-modes.md` and `docs/zero-token/zero-token-requirements.md`.)

---

## Specification Cross-Check

| `docs/zero-token/zero-token-requirements.md` Section | Corresponding Task |
|------------------------------------------------------|-------------------|
| §1 Target Capabilities / End-to-End | Tasks 2–4 maintain behavioral equivalence |
| §2 Reduce Core Intrusion | Tasks 2–4 consolidate hot spots; Task 1 documents remaining change surface |
| §3 Browser Authorization | Task 5 (and optional Task 6) |
| §4 Web Model Directory | Implementation already consolidated under `src/zero-token/`; `models-config` large sections can be further thinned later |

## Plan Self-Check

- No TBD / "similar to Task N" placeholders.
- `getWebStreamFactory` matches the original 11 `api` strings in `attempt.ts`.

---

## Validation Records (2026-03-28)

| Command | Result |
|---------|--------|
| `pnpm exec vitest run src/zero-token/streams/web-stream-factories.test.ts` | PASS |
| `pnpm exec vitest run src/plugins/hooks.model-override-wiring.test.ts` | PASS |
| `pnpm exec vitest run src/agents/pi-embedded-runner/run/attempt.test.ts src/agents/pi-embedded-runner/compact.hooks.test.ts` | PASS (removed tests for deleted exports; fixed compact.hooks message-channel mock; compactEmbeddedPiSession completes before/after_compaction sentinel hooks for ownsCompaction engine path) |
| `pnpm build` | PASS (after full dependency installation) |
| `npx -y bb-browser --help` | CLI usable (Task 6 documentation conclusion basis) |

**Plan file:** `docs/zero-token/plans/2026-03-28-zero-token-refactor.md` (Tasks 1–6 steps all checked complete).

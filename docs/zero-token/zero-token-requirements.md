# OpenClaw Zero Token — Product Requirements & Evolution Tracking

> **Purpose**: Solidify confirmed goals and constraints for iteration, review, and alignment with upstream OpenClaw.  
> **Language**: Body primarily in Chinese; short English summary at the end.

| Field    | Value     |
| -------- | --------- |
| Status   | Confirmed |
| Last Updated | 2026-03-28 (implementation plan at `docs/zero-token/plans/2026-03-28-zero-token-refactor.md`) |

---

## 1. Target Capabilities

- Use large models through **web versions of various platforms** (e.g. Claude, ChatGPT, DeepSeek, Gemini, Qwen, Kimi, Doubao, GLM, Grok, MiMo, etc.) in **openclaw-zero-token**.
- **No dependency** on official platform **API Keys** as the primary path; complete conversations via **browser login state** (Cookie, Header, in-page requests, etc.).
- **End-to-end**: After users send messages to OpenClaw from various channels, route to the corresponding **Web Model Provider**, reliably retrieve model output (including **streaming**), and continue processing through OpenClaw's existing chain (tools, sessions, channel callbacks, etc.).

---

## 2. Maintenance & Upstream Sync Strategy (Core Constraint)

- Minimize invasive modifications to **[openclaw/openclaw](https://github.com/openclaw/openclaw) upstream core `src/`** to avoid costly conflict resolution on every `merge` / `rebase`.
- **Prefer** placing Zero Token-specific logic in:
  - **`extensions/*` plugins** (e.g. existing Web model registration and extension packages), and
  - **configuration** (e.g. `openclaw.json` / environment conventions), **scripts and documentation**.
- Conclusion after aligning with the "making OpenClaw into an API with [CLI-Anything](https://github.com/HKUDS/CLI-Anything)" discussion:
  - CLI-Anything is better suited for generating Python CLIs for **desktop/applications with source code** and is **not** suitable as the primary approach for turning OpenClaw into HTTP or replacing Gateway.
  - The meaning of "API" in this project should be: **a stable, integrable call surface** — the existing **CLI**, **Gateway WebSocket**, and a **thin HTTP adaptation layer** added as needed in the future, rather than necessarily wrapping another layer with CLI-Anything.

---

## 3. Browser Authorization & Session Reuse

### 3.1 Current Baseline

- Use **`start-chrome-debug.sh`** to launch Chrome with **`--remote-debugging-port`** and a **dedicated `user-data-dir`** (isolated from the daily browser).
- Configure **`browser.attachOnly`** + **`cdpUrl`**, with **`src/providers/*-web-auth.ts`** / **`*-web-client-browser.ts`** connecting via **Playwright `connectOverCDP`** to fetch credentials or drive pages.

### 3.2 Optimization Direction (Product Goal)

- Move toward **"reusing the user's real browser login state"** where **technically feasible and securely controllable**, reducing the friction of "having to launch a separate debug browser".
- **Reference ideas** (not binding to any specific implementation):
  - [bb-browser](https://github.com/epiral/bb-browser): extension + native channel, OpenClaw integration mode, etc.
  - [insidebar-ai](https://github.com/xiaolai/insidebar-ai): use various platforms within an already logged-in browser environment (product-level "session in the browser").

### 3.3 Technical Constraints (Avoid False Expectations)

- **The same Chrome `user-data-dir` cannot run two browser instances simultaneously**; if a user already has "normal Chrome" open, launching a debug instance with the same directory will typically fail or result in undefined behavior.
- **Chrome not started in debug mode cannot be attached via CDP**; without a port or extension bridge, it cannot magically read another process's login state.
- Available paths must be clearly documented: **dedicated debug shortcut (single instance)**, **separate Profile (current)**, **extension/daemon bridge**, etc., along with their trade-offs.

---

## 4. Architecture Alignment (with Current Repo)

- **Web model implementation** is concentrated in **`src/zero-token/`** (`providers/` site clients and login helpers, `streams/` stream factories and `web-stream-factories.ts`). Core retains only thin bridges (e.g. `src/agents/web-stream-factories.ts` re-export, `models-config` and CLI import paths).
- Evolution direction: while keeping the **OpenClaw Provider pipeline** unchanged, continue to confine **changes that conflict easily with upstream** to `src/zero-token/` and a few bridge files for easier rebase.

---

## 5. Non-Goals (Not Committed at Current Stage)

- Do not commit to using CLI-Anything as the official primary integration method.
- Do not commit that bb-browser's site adapters will **individually** cover the full conversation capabilities of all Web model sites; whether to introduce it and the scope depend on **PoC and maintenance cost**.
- Do not commit to bypassing platform terms of service or anti-automation policies; implementation is based on **compliance and user's own risk** (see main README disclaimer).

---

## 6. Change Log

| Date       | Description |
| ---------- | ---- |
| 2026-03-28 | Initial draft: five requirements confirmed with user (Web model without API Key, plugin-based to reduce fork conflicts, browser login state optimization, call surface definition, end-to-end pipeline) |
| 2026-03-28 | Superpowers implementation plan: `docs/zero-token/plans/2026-03-28-zero-token-refactor.md`; browser mode docs: `docs/zero-token/web-models-browser-modes.md`; upstream sync checklist: `docs/zero-token/upstream-sync.md`; Web stream registry in `src/zero-token/streams/web-stream-factories.ts` (`src/agents/web-stream-factories.ts` is re-export) |
| 2026-03-28 | **bb-browser PoC (documented conclusion)**: CLI works; adapters target external structured data, do **not** replace 11 Web chat Providers; summary in `docs/zero-token/web-models-browser-modes.md` "bb-browser PoC Summary"; not added as default `package.json` dependency. |
| 2026-03-28 | Plan wrap-up: README "Upstream Sync" links to `docs/zero-token/upstream-sync.md`; `hooks.model-override-wiring` passes; fixed `compact.hooks.test.ts` `INTERNAL_MESSAGE_CHANNEL` mock; removed tests in `attempt.test.ts` for deleted `wrapStreamFnRepairMalformedToolCallArguments`. |
| 2026-03-28 | `compactEmbeddedPiSession`: when `contextEngine.info.ownsCompaction` is true, trigger `before_compaction` / `after_compaction` around `contextEngine.compact` call (`messageCount`/`compactedCount` sentinels set to `-1`, consistent with `compact.hooks.test.ts` convention). |
| 2026-03-28 | **Directory consolidation**: Web model implementation moved to **`src/zero-token/providers/`** and **`src/zero-token/streams/`**; `src/agents/web-stream-factories.ts` is now a re-export only; removed redundant **`extensions/web-models`** and **`src/plugin-sdk/web-models.ts`**; `extensions/askonce` adapters now reference `src/zero-token/streams/*`. |
| 2026-03-28 | **AskOnce**: plugin directory moved to **`src/zero-token/extensions/askonce/`**; `resolveBundledPluginSearchDirs` scans both `extensions/` and **`src/zero-token/extensions/`**. |
| 2026-03-28 | **`models-config` bridge extraction**: Web constants, `discover*WebModels`, `build*WebProvider` moved to **`src/zero-token/bridge/web-providers.ts`**; `models-config.providers.ts` handles import, `resolveImplicitProviders` merging, and **re-exports** original symbols to keep existing import paths like `onboard-auth.config-core` unchanged. |
| 2026-03-28 | **Complete Web wiring**: `perplexity-web` / `qwen-cn-web` registered in **`web-stream-factories`** and **`resolveImplicitProviders`**; new **`buildPerplexityWebProvider`**; `glm-intl-web` unconditionally merged like other Web channels; **`docs/zero-token/upstream-sync.md`** aligned with current directory; **`release-check`** deduplicates bundled extensions by id; **`discovery`** comments explain that bundled scanning chmods directories. |
| 2026-03-28 | **Documentation directory**: Zero Token-specific docs consolidated under **`docs/zero-token/`** (index at `docs/zero-token/index.md`); original same-name pages under `docs/` root add **redirect** in Mintlify to new paths. |

*Subsequent optimizations (e.g. selecting the final "debug Chrome / extension bridge" solution, migrating a Provider out of core) please add a row to this table.*

---

## English summary

**Zero Token** uses web UIs and browser session (cookies, etc.) instead of paid API keys. **Minimize invasive changes** to upstream OpenClaw core; prefer **`extensions/*`** and config. **Improve auth UX** toward reusing real browser login where technically possible, respecting Chrome profile / CDP constraints. **Stable integration surface** = CLI + Gateway WS (optional thin HTTP later); **not** CLI-Anything as the primary “API” strategy. **End-to-end**: messages route to web providers, streaming replies return through normal OpenClaw handling.

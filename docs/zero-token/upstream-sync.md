# Syncing with Upstream OpenClaw (Zero Token)

## Change Surface Checklist (Priority Check on Merge)

The following paths are typically **intentionally different** from [openclaw/openclaw](https://github.com/openclaw/openclaw), and require manual review during `git merge` / `git rebase`:

### Zero Token Implementation Tree (Main Body)

- **`src/zero-token/providers/`** — Per-site Web clients, `login*Web`, browser automation
- **`src/zero-token/streams/`** — `*-web-stream.ts`, `web-stream-factories.ts` (`model.api` → `StreamFn`)
- **`src/zero-token/bridge/web-providers.ts`** — Web baseUrl, default models, `build*WebProvider` / `discover*WebModels`
- **`src/zero-token/extensions/askonce/`** — Bundled AskOnce plugin (`@openclaw/askonce`)
- **`start-chrome-debug.sh`、`onboard.sh`、`server.sh`** (if present)
- **`docs/zero-token/zero-token-requirements.md`**、**`docs/zero-token/web-models-support.md`**、**`docs/zero-token/web-models-browser-modes.md`**、**`docs/zero-token/upstream-sync.md`** (this document)、**`docs/zero-token/index.md`**

### Agent and Web Streaming (Thin Integration)

- **`src/agents/web-stream-factories.ts`** — **Re-export** of `zero-token/streams/web-stream-factories` (stable import for `attempt` / `compact`)
- **`src/agents/pi-embedded-runner/run/attempt.ts`** — Web branch should **only** call `getWebStreamFactory`, do not inline site protocols
- **`src/agents/pi-embedded-runner/compact.ts`** — Same as above
- **`src/agents/models-config.providers.ts`** — `resolveImplicitProviders` merges each `*-web` provider (calls bridge `build*`)

### CLI / Onboarding / Auth Entry Points

- **`src/commands/onboard-web-auth.ts`**、`src/commands/auth-choice.apply.*-web.ts` — Login wizard (internally `import ../zero-token/providers/*-auth`)
- **`src/commands/onboard-auth.config-core.ts`** — Web default models / allowlist, etc. (constants referenced from `zero-token/bridge/web-providers`)

### Config, Plugin Discovery & Packaging

- **`src/config/types.models.ts`** — `ModelApi` includes each `*-web`
- **`src/plugins/bundled-dir.ts`**、**`src/plugins/discovery.ts`** — Scans `extensions/` and **`src/zero-token/extensions/`**; `discoverOpenClawPlugins` uses the provided `env` to resolve bundled / config directories
- **`pnpm-workspace.yaml`** — Includes `src/zero-token/extensions/*`
- **`package.json` `files`** — Includes `src/zero-token/extensions/`
- **`Dockerfile`** — Copies `src/zero-token/extensions` at runtime
- **`scripts/sync-plugin-versions.ts`**、**`scripts/release-check.ts`** — Iterates over `extensions/` and `src/zero-token/extensions/`

## Root README (Must Keep This Fork)

The repository root **`README.md`** and **`README.zh-CN.md`** must **always use the Zero Token fork version**, and must not be overwritten by upstream OpenClaw's same-named files.

Both files have been set with **`merge=ours`** in **`.gitattributes`**: during `git merge upstream/main`, if both sides have modified these files, Git will **automatically keep the current branch (this fork) version**, eliminating the need for manual `checkout --ours`.

**Note:**

- If you **intentionally** want to merge a specific general fix from upstream's README, **manually copy** the relevant paragraph into this fork's README after the upstream release; do not rely on merge to auto-import the entire file.
- If a README conflict occurs during **`git rebase upstream/main`**, you should still **keep this fork's wording**; `merge=ours` primarily protects regular **merge** scenarios.
- Do not use merge strategies that would discard this fork's version on root README (e.g. mistakenly using blanket `-X theirs`).

## Recommended Sync Steps

1. `git fetch upstream` (configure `openclaw/openclaw` as `upstream`)
2. `git merge upstream/main` (or `rebase`, per team preference)
3. Resolve conflicts per this section's checklist; **prioritize keeping** upstream fixes to generic subsystems, then reapply Zero Token's Web-related hunks
4. `pnpm install && pnpm build`
5. `OPENCLAW_TEST_PROFILE=low pnpm test` (or full `pnpm test`, depending on machine resources)

## Non-Goals

- File-level parity with upstream is not required; **behavioral regression** (Web model conversation, onboard authorization) must be verifiable.

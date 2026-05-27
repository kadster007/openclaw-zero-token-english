# Web Models: Browser & CDP Modes

This document explains the various usages and hard constraints when Zero Token connects to Chrome via Playwright **CDP**, intended to be read alongside `docs/zero-token/zero-token-requirements.md`.

## Mode A: Dedicated Debug Profile (Current Default)

- **Approach**: Run `start-chrome-debug.sh`, which uses a dedicated `user-data-dir` (e.g. `~/.config/chrome-openclaw-debug` on Linux) and enables `--remote-debugging-port=9222`.
- **Configuration**: `browser.attachOnly: true`, `browser.cdpUrl` (or `cdpUrl` in the profile) points to `http://127.0.0.1:9222`.
- **Pros**: Does not compete with daily Chrome for the same user directory; behavior is stable, documentation and scripts are consistent.
- **Cons**: You must log in to each platform within **this** browser instance, which is not the same session as your "daily logged-in Chrome".

## Mode B: User-Managed Single-Instance Debug Chrome

- **Approach**: User starts a **single** Chrome process with a fixed `user-data-dir` + `--remote-debugging-port` (e.g. via a desktop shortcut); OpenClaw only **attaches** to that port.
- **Constraint**: **The same `user-data-dir` cannot run two Chrome instances simultaneously**. If normal Chrome is already open using that directory, launching a debug instance will fail or behave erratically; either close the existing instance or use a dedicated directory separate from daily use.
- **When is it effectively "session reuse"**: Only when the user **always** uses this debug instance for browsing and login, or when the directory is accepted by the user as a "dedicated Zero Token environment", does it amount to long-term session reuse.

## Mode C: Extension/Daemon Bridge (Reference)

- **Reference projects**: [bb-browser](https://github.com/epiral/bb-browser) (extension + native service), [insidebar-ai](https://github.com/xiaolai/insidebar-ai) (sidebar product approach for reusing site sessions).
- **Current status**: The main path in this repo remains **CDP + Playwright**; whether to adopt bb-browser-style integration depends on **PoC conclusions** (see "bb-browser PoC Summary" below and the change log in `docs/zero-token/zero-token-requirements.md`).
- **Note**: This mode does not rely on "attaching CDP to a non-debug-port Chrome" — a bridge layer must be separately implemented or integrated.

### bb-browser PoC Summary (Conclusions)

| Dimension | Conclusion |
|-----------|-----------|
| CLI Usability | `npx bb-browser --help` displays commands normally (`site`, `open`, `eval`, `fetch`, etc.), suitable as a **standalone tool** or **MCP** invoked by an Agent. |
| Relationship with Zero Token Web Models | bb-browser focuses on **site adapters** (search/trending/structured data extraction); it **cannot** replace the streaming conversation and tool protocol implementation of the 11 Web chat Providers in `src/zero-token/streams/web-stream-factories.ts`. |
| `--openclaw` | Documentation indicates it can use OpenClaw's built-in browser; this is a **parallel capability** to **this fork's CDP auth + `*-web-stream`**, not a replacement. |
| Recommended Usage | When external data is needed, expose `bb-browser` via **Tool/MCP**; the main conversation model still goes through existing Web Providers. |
| Dependency | **This repo does not add** `bb-browser` as a default dependency; users can `npm i -g bb-browser` or use `npx` as needed. |

## Configuration Summary

| Mode | Typical `user-data-dir` | CDP Port | Parallel with Daily Chrome |
| ---- | ----------------------- | -------- | -------------------------- |
| A    | Script-specified dedicated directory | 9222 | Yes (different directory) |
| B    | User-selected (single instance required) | User-specified | Not possible with same directory |
| C    | Depends on specific solution | Depends on solution | Depends on solution |

Authorization commands still write credentials to the local profile via `onboard-web-auth` / `auth-choice`, etc.; CDP only handles "who starts the browser and which Chrome to connect to".

# Competitor Research Report

> Research Date: 2026-04-19
> Core Filters: **Free model tier** + **Free Claude support** + **No user API key required** + **Exclude purely local models** + **Updated within last 3 months**

---

## Filter Criteria

| Dimension              | Criteria                                                   |
| ---------------------- | ---------------------------------------------------------- |
| **Free Models**        | Project provides free tier/quota, no paid API key required |
| **Claude Support**     | Supports free Claude access via some method (any version)  |
| **API Key Required**   | Does not require user to provide OpenAI/Anthropic API keys |
| **Local Models**       | Excludes Ollama, llama.cpp and other purely local inference |
| **Activeness**         | Last updated after 2026-01-19 (~3 months)                  |
| **Size Reference**     | Stars > 100 (reference, not hard threshold)                |

> **Free ≠ No Account**: The legitimate path for "free" is reusing the user's own account free quota (OAuth/Cookie/CLI login), not stealing others' services or requiring users to purchase their own API keys.

---

## Top 10 Finalists (by Technical Approach)

### 1. CLI/IDE Subscription to API (Core approach, OAuth/CLI emulation, best source for free Claude)

| Project                                                                               | Stars      | Language     | Last Updated | Free Claude Source                  | Other Free Models                   | Technical Highlights                               |
| ------------------------------------------------------------------------------------- | ---------- | ------------ | ------------ | ----------------------------------- | ----------------------------------- | -------------------------------------------------- |
| **[router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)**         | **27,163** | Go           | 2026-04-19   | ✅ Gemini CLI OAuth + GPT-5 etc.    | Gemini 2.5 Pro / GPT-5 etc.         | Most complete ecosystem (macOS/Win/VSCode plugin), auto OAuth refresh |
| **[justlovemaki/AIClient-2-API](https://github.com/justlovemaki/aiclient-2-api)**     | **7,053**  | JavaScript   | 2026-04-19   | ✅ **Kiro** (includes Opus 4.5)     | Gemini/Qwen/Grok/Claude Code        | TLS fingerprint bypass, OAuth breakthrough, multi-account pool |
| **[decolua/9router](https://github.com/decolua/9router)**                             | **2,669**  | JavaScript   | 2026-04-17   | ✅ Anthropic unlimited              | Gemini/iFlow/Qwen                   | Combo routing (3-level fallback), visual dashboard |
| **[Alishahryar1/free-claude-code](https://github.com/Alishahryar1/free-claude-code)** | **1,968**  | Python       | 2026-04-18   | ✅ OpenRouter free tier / NVIDIA NIM| DeepSeek/Qwen etc.                  | Auto-routing by model, Discord/Telegram Bot support |
| **[musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)** | **18,338** | TypeScript   | 2026-03-04   | ✅ Claude Code subscription mapping | DeepSeek/Kimi etc.                  | Cloudflare Workers edge deployment, 300+ nodes globally |
| **[codeking-ai/cligate](https://github.com/codeking-ai/cligate)**                     | 25         | JavaScript   | 2026-04-19   | ✅ DeepSeek/Qwen free routing       | DeepSeek/Qwen/MiniMax               | Claude Code specific, account pool and Dashboard |

---

### 2. Browser Automation / Web Reverse Engineering (Same approach as openclaw-zero-token, stable but depends on login state)

| Project                                                           | Stars      | Language | Last Updated | Free Claude Source              | Other Free Models                              | Technical Highlights                              |
| ----------------------------------------------------------------- | ---------- | -------- | ------------ | ------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| **[xtekky/gpt4free](https://github.com/xtekky/gpt4free)**         | **66,030** | Python   | 2026-04-18   | ✅ Claude (reverse engineering) | 50+ providers (GPT/DeepSeek/Kimi/Gemini)        | Largest scale, 50+ providers, OpenAI compatible API |
| **[Xerxes-2/clewdr](https://github.com/Xerxes-2/clewdr)**         | **1,124**  | Rust     | 2026-04-07   | ✅ Claude Web Cookie            | ❌                                              | Single binary <10MB, Rust high performance, management UI |
| **[mirrorange/clove](https://github.com/mirrorange/clove)**       | **708**    | Python   | 2026-03-28   | ✅ **Claude OAuth** (pioneering)| ❌                                              | OAuth + web reverse proxy dual mode, OpenAI/Anthropic dual protocol compatible |
| **[caiwuu/web2api](https://github.com/caiwuu/web2api)**           | **480**    | Python   | 2026-04-15   | ✅ Claude Web Cookie            | GPT/DeepSeek/Grok                               | Lightweight, focused on multi-platform aggregation |
| **[Amm1rr/WebAI-to-API](https://github.com/Amm1rr/WebAI-to-API)** | **1,024**  | Python   | 2025-12-31   | ✅ Claude (reverse engineering) | Gemini/DeepSeek/Grok                            | Gemini Web core, Cookie auto-auth                |

---

## Special Mention: Kiro/AWS

| Project                                                           | Stars   | Language | Last Updated | Free Claude Source                          | Technical Highlights                                    |
| ----------------------------------------------------------------- | ------- | -------- | ------------ | ------------------------------------------- | ------------------------------------------------------- |
| **[jwadow/kiro-gateway](https://github.com/jwadow/kiro-gateway)** | **959** | Python   | 2026-04-19   | ✅ **Kiro full series** (Sonnet 4.5/Haiku 4.5) | Anthropic IDE/CLI specific, dual protocol (OpenAI + Anthropic) support |

> **About Kiro**: Kiro (backed by AWS CodeWhisperer) currently provides **Claude Opus 4.5 / Haiku 4.5 unlimited free**, making it one of the most stable sources of free Claude. Recommended for attention.

---

## Excluded Projects and Reasons

| Project                     | Exclusion Reason                             |
| --------------------------- | -------------------------------------------- |
| LibreChat (35k stars)       | Requires user API key, violates "free" condition |
| one-api (32k stars)         | Commercial key relay, no free models         |
| Trae Agent (11k stars)      | Official ByteDance project, not an API proxy, no updates in 2 months |
| raycast-g4f (1k stars)      | Last updated 2025-12, no Kiro/CLI approach   |
| free-one-api (810 stars)    | Aggregated reverse library, unstable, Claude support uncertain |
| Poe API (2.4k stars)        | Marked UNMAINTAINED, discontinued 2023-09    |

---

## Key Conclusions

**Top 3 most valuable projects to reference (by priority):**

1. **[CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)** (27k stars) — Largest scale, most complete ecosystem. Converts Gemini CLI / Claude Code / Codex official tools to API, supports OAuth free authentication
2. **[AIClient-2-API](https://github.com/justlovemaki/aiclient-2-api)** (7k stars) — TLS fingerprint bypass + Anthropic free Opus 4.5, different but complementary approach to openclaw-zero-token
3. **[gpt4free](https://github.com/xtekky/gpt4free)** (66k stars) — Largest scale, 50+ providers, but relies on reverse engineering maintenance (instability risk)

**openclaw-zero-token's differentiated positioning** (compared to above projects):

- **CDP browser automation** vs reverse engineering / CLI emulation — more stable, relies on real login state
- **Multi-web platform aggregation** vs single approach — covers Claude/ChatGPT/Gemini/DeepSeek/Qwen/Kimi etc.
- **Gateway HTTP API** vs Python library / CLI tool — ready out of the box, suitable for integrating various clients

---

## Trae / Anthropic Special Notes

- **Trae**: ByteDance's official IDE, includes free Claude 3.7/4.0 Sonnet, but does not expose a standalone Web API, no mature open-source reverse engineering proxy currently available (Trae-Proxy discontinued 2025-08)
- **Kiro**: Backed by AWS CodeWhisperer, Claude Opus 4.5/Haiku 4.5 **unlimited free**, currently the most stable source of free Claude, supported by `kiro-gateway`, `9router`, `AIClient-2-API`

---

## Deep Technical Analysis: Top 3 Competitor Implementation Approaches

### 1. CLIProxyAPI (27k stars) — OAuth Automation + CLI Emulation

**Technical Architecture:**

```
Client (Claude Code / Cursor)
        ↓ OpenAI compatible request
  CLIProxyAPI (Go, binary)
        ↓
  ┌─ Gemini CLI (OAuth login, 180K tokens/month free)
  ├─ Claude Code (OAuth login)
  ├─ OpenAI Codex (OAuth login)
  ├─ Anthropic compatible upstream (OpenRouter etc.)
  └─ Claude Code / Anthropic / Qwen CLI
```

**Core Implementation Principles:**

1. **OAuth Auth Flow**: Built-in OAuth flow guides users through Google/Microsoft account authorization, obtains access_token + refresh_token with auto-refresh
2. **CLI Process Injection**: Launches Gemini CLI / Claude Code processes via subprocess, hijacks their HTTP requests, injects user's OAuth token
3. **Request Hijacking**: Intercepts OpenAI format requests at the Go layer, converts to each CLI's internal protocol (env variable injection, subprocess stdio)
4. **Streaming Response Handling**: Relays CLI streaming output via stdio or websocket
5. **Multi-Account Pool + Round-Robin**: Configure multiple OAuth accounts, round-robin distribution, auto-switch when quota exhausted

**Key Code Modules:**

- `internal/provider/` — Each CLI provider's executor and protocol converter
- `internal/translator/` — OpenAI ↔ Anthropic ↔ Gemini format conversion
- `auths/` — OAuth token persistent storage (JSON file)
- `internal/browser/` — Built-in browser OAuth guidance (no manual URL opening needed)

**What openclaw-zero-token can learn:**

- OAuth auto-refresh mechanism (no manual token renewal needed)
- Multi-account pool + round-robin (improves availability)
- Built-in OAuth guided browser (lowers user configuration barrier)

---

### 2. AIClient-2-API (7k stars) — TLS Fingerprint Bypass + Anthropic Format Emulation

**Technical Architecture:**

```
Client (any OpenAI compatible tool)
        ↓ OpenAI compatible request
  AIClient-2-API (Node.js)
        ↓
  ┌─ Anthropic API (includes free Claude Opus 4.5)
  ├─ Gemini CLI (OAuth authentication)
  ├─ Claude Code / Grok / Qwen
  └─ Anthropic native API (OAuth injection)
```

**Core Implementation Principles:**

1. **TLS Fingerprint Bypass** (key differentiator): Built-in `tls-sidecar` (Go uTLS), emulates Chrome/Firefox TLS handshake fingerprint (ClientHello), bypasses Cloudflare CDN bot detection
2. **Anthropic Format Injection**: Injects Claude Code's Anthropic format requests (with `require_auth: true`) with OAuth token, forwards to Anthropic compatible endpoint
3. **Kiro API Access**: Kiro is backed by AWS CodeWhisperer, implements Claude Opus 4.5 unlimited free calls via `kirocli:social:token` / `kirocli:odic:token` SQLite token injection
4. **OAuth Token Persistence**: Stores tokens via SQLite, auto-refreshes, avoids repeated user login

**Key Code Modules:**

- `src/providers/` — Each provider's adapter (adapter.js)
  - `claude/` — Claude API request construction
  - `gemini/` — Gemini CLI request construction
  - `forward/` — Upstream forwarding
- `tls-sidecar/` — Go uTLS library, called via FFI from Node.js
- `src/auth/` — OAuth auth flow management

**What openclaw-zero-token can learn:**

- uTLS fingerprint bypass (counter Cloudflare Bot detection — CDP approach naturally avoids this)
- Anthropic SQLite token extraction (`token.db` under `~/.kiro/`, directly reusable)
- Anthropic native API format compatibility (more complete than OpenAI format)

---

### 3. kiro-gateway (959 stars) — Kiro/AWS Specialized, Most Stable Free Claude Source

**Technical Architecture:**

```
Client (Claude Code / Cursor / OpenClaw)
        ↓ OpenAI format or Anthropic format
  kiro-gateway (Python/FastAPI)
        ↓
  Anthropic IDE/CLI Internal API
  (Backed by AWS CodeWhisperer)
  https://prod.{region}.auth.desktop.kiro.dev/refreshToken
        ↓
  Claude Opus 4.5 / Haiku 4.5 / Opus 4.5 (unlimited free)
```

**Core Implementation Principles:**

1. **Two Authentication Methods**:
   - **KIRO_DESKTOP**: Kiro IDE desktop client token (`kirocli:social:token`), OAuth refresh
   - **AWS_SSO_OIDC**: `kirocli:odic:token`, AWS SSO OIDC protocol (enterprise)
2. **Token Storage**: Reads from SQLite database (`~/.kiro/token.db`), searches multiple keys by priority
3. **Auto Refresh**: asyncio.Lock ensures thread safety, auto-refreshes before expiry
4. **Format Conversion**: Full implementation of OpenAI `/v1/chat/completions` and Anthropic `/v1/messages` dual protocol endpoints
5. **Thinking Parsing**: Built-in `thinking_parser.py` handles Claude's `think` tag blocks

**Key Code Modules:**

- `kiro/auth.py` — Auth lifecycle management (load → store → refresh)
- `kiro/routes_openai.py` — OpenAI compatible endpoint
- `kiro/routes_anthropic.py` — Anthropic native endpoint
- `kiro/converters_anthropic.py` — Response format conversion
- `kiro/streaming_anthropic.py` — SSE streaming parsing
- `kiro/truncation_recovery.py` — Truncation recovery (Claude long output interruption recovery)
- `kiro/tokenizer.py` — Token counting (for context window management)

**What openclaw-zero-token can learn:**

- **Direct Kiro token reuse**: openclaw-zero-token can directly read SQLite tokens from `~/.kiro/token.db` like kiro-gateway, no OAuth flow needed
- **Dual protocol endpoints**: `/v1/chat/completions` + `/v1/messages` simultaneously supported, compatible with all clients
- **truncation_recovery.py**: Auto-continuation after Claude long output truncation, valuable for long task processing

---

## Cross-Technology Comparison

| Technical Dimension         | CLIProxyAPI                           | AIClient-2-API                    | kiro-gateway                          |
| --------------------------- | ------------------------------------- | --------------------------------- | ------------------------------------- |
| **Language**                | Go                                    | Node.js + Go (tls-sidecar)        | Python                                |
| **Auth Method**             | OAuth auto guidance + browser injection| OAuth + uTLS fingerprint + SQLite token | Direct SQLite token read       |
| **Cloudflare Bypass**       | ✅ Claude Code/Gemini CLI already bypasses| ✅ uTLS fingerprint              | ❌ Direct API request                 |
| **Multi-Account Pool**      | ✅ round-robin                        | ✅ provider-pool-manager           | ❌ Single account                     |
| **Streaming Output**        | ✅ stdio/ws relay                     | ✅ adapter layer                   | ✅ SSE parsing                        |
| **Anthropic Format**        | ✅ Bidirectional conversion           | ✅                                 | ✅ Native support                     |
| **Tool Calling**            | ✅                                    | ✅                                 | ✅                                    |
| **Claude Thinking Parsing** | ✅                                    | ✅                                 | ✅                                    |
| **Free Claude Version**     | Claude Code subscription mapping      | Opus 4.5 (Kiro)                    | Opus 4.5 / Sonnet 4.5 / Haiku 4.5    |
| **External Process Dependency| ✅ (CLI processes)                    | Partial                            | ❌ (Direct HTTP)                      |
| **Embeddable SDK**          | ✅ (Go SDK)                           | ❌                                 | ❌                                    |

---

## Specific Recommendations for openclaw-zero-token

### High Priority (Easiest to Integrate, Most Impact)

**1. Direct Anthropic Token Reuse**

- kiro-gateway has proven: simply read token from `~/.kiro/token.db` SQLite
- Just install Anthropic IDE, token persists after login, no OAuth flow needed
- Benefit: immediately obtain Claude Opus 4.5 / Sonnet 4.5 unlimited free calls
- Integration: add `kiro-web-auth.ts` + `kiro-web-client.ts` under `src/providers/`

**2. Anthropic Native Format Support**

- kiro-gateway has full `/v1/messages` endpoint implementation
- Currently openclaw-zero-token only exposes OpenAI compatible format, limiting full Claude Code functionality (thinking budget, extended tools)
- Integration: implement `/v1/messages` route referencing `kiro/routes_anthropic.py`

**3. truncation_recovery Approach**

- Claude long output (e.g. code generation) exceeding context window gets truncated
- kiro-gateway has continuation mechanism, can auto-complete
- Directly valuable for openclaw-zero-token's long Agent task chains

### Medium Priority (More Development Work Required)

**4. OAuth Auto-Refresh Mechanism (CLIProxyAPI style)**

- User only needs one OAuth login, token auto-renews afterwards
- Currently openclaw-zero-token's Cookie auth requires manual refresh
- Benefit: reduces long-term manual maintenance costs

**5. Multi-Account Pool + Round-Robin (CLIProxyAPI style)**

- Kiro/AWS accounts have rate limits, multi-account round-robin improves concurrency
- Already proven by 9router, CLIProxyAPI
- Medium integration complexity, requires account management UI

### Low Priority (openclaw-zero-token's CDP approach is already superior)

**6. TLS Fingerprint Bypass (AIClient-2-API style)**

- CDP approach naturally bypasses Cloudflare, no uTLS needed
- However may be useful for non-CDP providers (e.g. direct HTTP Anthropic API)
- Tradeoff: introducing Go uTLS dependency adds complexity, only valuable for some providers

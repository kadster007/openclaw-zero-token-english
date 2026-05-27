# Web Model Tool Calling Principles

## Overview

Web models (accessed via browser for ChatGPT, DeepSeek, Kimi, etc.) do not have native tool calling APIs.
OpenClaw Zero Token enables tool calling for these models through **prompt injection**.

Based on:

- Paper: [Achieving Tool Calling in LLMs Using Only Prompt Engineering](https://arxiv.org/html/2407.04997v1) (100% format accuracy)
- Open source project: [ComfyUI LLM Party](https://github.com/heshengtao/comfyui_LLM_party) (5k+ stars, production-proven)

## Full Flow Example

User asks: "What files are on my desktop?"

````
You send: "What files are on my desktop?"
          ↓
    ① Middleware intercepts (web-stream-middleware.ts)
       - Extracts your message (13 chars)
       - Injects tool definition prompt (~650 chars)
       - Composes full prompt to send to model
          ↓
    ② Sends to DeepSeek web via browser
          ↓
    ③ DeepSeek replies:
       ```tool_json
       {"tool":"exec","parameters":{"command":"ls -la ~/Desktop"}}
       ```
          ↓
    ④ Middleware extracts tool call using regex
       → Identifies: tool=exec, parameters=ls -la ~/Desktop
       → Converts to ToolCall event for OpenClaw Agent
          ↓
    ⑤ Agent executes ls -la ~/Desktop on local machine
       → Gets file list
          ↓
    ⑥ Middleware feeds execution result back to DeepSeek:
       "Tool exec returned: total 24
        -rw-r--r-- 1 user staff 1024 report.pdf
        -rw-r--r-- 1 user staff 2048 notes.txt ..."
          ↓
    ⑦ DeepSeek generates final response based on result:
       "Your desktop has the following files:
        - report.pdf (1KB)
        - notes.txt (2KB) ..."
          ↓
     You see the reply
````

## Prompt Template

The prompt injected into the model is approximately **780 characters**, consisting of 3 parts:

### 1. Tool Definitions (JSON Array)

```json
[
  { "name": "web_search", "description": "Search web", "parameters": { "query": "string" } },
  { "name": "web_fetch", "description": "Fetch URL", "parameters": { "url": "string" } },
  { "name": "exec", "description": "Run command", "parameters": { "command": "string" } },
  { "name": "read", "description": "Read file", "parameters": { "path": "string" } },
  {
    "name": "write",
    "description": "Write file",
    "parameters": { "path": "string", "content": "string" }
  },
  {
    "name": "message",
    "description": "Send msg",
    "parameters": { "text": "string", "channel": "string" }
  }
]
```

### 2. Format Example (Paper Core: Teach Model with Simple Example)

````
Example: To add 1 to the number 5, return:
```tool_json
{"tool":"plus_one","parameters":{"number":"5"}}
```

(plus_one is just an example, not a real tool)
```
The paper points out: **Example-based teaching is key to 100% format accuracy**. Using a simple `plus_one` example teaches the model the output format without confusing it with real tools.

### 3. Instructions

```

Your real tools are listed above. Only reply with a tool_json block when needed. Otherwise, answer directly.

```

## Per-Model Customization

| Model | Template Language | Notes |
|-------|-----------------|-------|
| DeepSeek, Doubao, Qwen CN, Kimi, GLM, Xiaomi MiMo | Chinese | Chinese models work better with Chinese instructions |
| ChatGPT | English + Strict Mode | Add "No extra text" to prevent appended explanations |
| Claude, Gemini, Grok, Qwen Web, GLM Intl | English | Standard English template |
| Perplexity | No injection | Search engine, does not support tool calling |

## Response Parsing

The middleware uses 3 regex patterns (in priority order) to extract tool calls:

1. **Fenced format** (most reliable):
```

```tool_json
{"tool":"web_search","parameters":{"query":"Tokyo weather"}}
```

````

2. **Bare JSON format**:
```
{"tool":"exec","parameters":{"command":"date"}}
```

3. **XML format** (DeepSeek compatible):
```
<tool_call>{"name":"read","arguments":{"path":"/etc/hostname"}}</tool_call>
```

## Tool Result Feedback

After tool execution, results are fed back to the model as a user message:

```
Tool exec returned: Saturday, April 5, 2026 10:03:22 CST
Please answer the original question based on this tool result.
```

The model receives the result and generates the final natural language reply.

## Architecture

```
src/zero-token/tool-calling/
├── web-stream-middleware.ts   # Middleware: wraps all web streams
├── web-tool-prompt.ts         # Prompt templates (per-model customization)
├── web-tool-parser.ts         # Regex-based tool call parsing
└── web-tool-defs.ts           # 6 core tool definitions
```

The middleware wraps all web stream factories uniformly in `web-stream-factories.ts`,
requiring no modifications to any stream file.

## Verified Models

| Model | Tool Calling | General Q&A | Notes |
|-------|-------------|-------------|-------|
| DeepSeek | ✅ | ✅ | exec listing desktop files succeeded |
| Kimi | ✅ | ✅ | All 6 tools verified |
| Claude | ✅ | ✅ | web_search succeeded |
| ChatGPT | ✅ | ✅ | web_search succeeded |
| Qwen CN | ✅ | ✅ | web_search succeeded |
| Qwen Web | ✅ | ✅ | web_search succeeded |
| Grok | ✅ | ✅ | web_search succeeded |
| Gemini | ✅ | ⚠️ | web_search triggered successfully, DOM scraping occasionally unstable |
| Xiaomi MiMo | ✅ | ✅ | web_search succeeded |
| Doubao | ❌ | ⚠️ | Does not understand tool prompts, replies have repetitions |
| GLM | ✅ | ✅ | Tool calling and general Q&A both passed |
| GLM Intl | ✅ | ✅ | Tool calling and general Q&A both passed |
| Perplexity | — | ✅ | Search engine, no tool injection |

**11/13 support tool calling**, 2 do not (Doubao, Perplexity).

#!/usr/bin/env bash
# Domestic qwen-cn-web full automated flow: select model (request body / RPC explicit model) → send message → verify non-empty response.
# L1: Vitest (web stream registration, etc.)
# L2: POST /v1/chat/completions, model=qwen-cn-web/Qwen3.5-Plus
# L3: openclaw agent --model qwen-cn-web/Qwen3.5-Plus (aligned with the "select model" in this run)
#
# Prerequisites: Gateway started; qwen-cn-web onboarded; jq required (L2/L3 validation).
# Environment variables:
#   WEB_MODEL_TEST_URL, WEB_MODEL_TEST_TOKEN (required)
#   WEB_MODEL_TEST_PROMPT (optional)
#   WEB_MODEL_TEST_QWEN_CN_MODEL (optional, default qwen-cn-web/Qwen3.5-Plus)
#
# Note: WebSocket chat.send (L4) has no per-request model, this script does not run L4;
# For full parity with Control UI, see docs/zero-token/WEB_MODEL_TEST_REPORT.md §L4/L5.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

QWEN_MODEL="${WEB_MODEL_TEST_QWEN_CN_MODEL:-qwen-cn-web/Qwen3.5-Plus}"
export WEB_MODEL_TEST_PROMPT="${WEB_MODEL_TEST_PROMPT:-Answer in one sentence: what is 1+1? Output only numbers and symbols.}"

echo "==> [L1] Zero Token web stream unit tests"
pnpm exec vitest run --config scripts/vitest.zero-token-web.config.ts

: "${WEB_MODEL_TEST_URL:?Set WEB_MODEL_TEST_URL, e.g. http://127.0.0.1:3001}"
: "${WEB_MODEL_TEST_TOKEN:?Set WEB_MODEL_TEST_TOKEN (Gateway Bearer)}"

BASE="${WEB_MODEL_TEST_URL%/}"

echo ""
echo "==> [Health Check] GET ${BASE}/healthz"
code="$(curl -sS -o /tmp/openclaw-healthz.json -w "%{http_code}" "${BASE}/healthz" || true)"
if [[ "$code" != "200" ]]; then
  echo "healthz HTTP $code, trying /health"
  code="$(curl -sS -o /tmp/openclaw-healthz.json -w "%{http_code}" "${BASE}/health" || true)"
fi
if [[ "$code" != "200" ]]; then
  echo "Gateway health check failed (last http=$code)" >&2
  cat /tmp/openclaw-healthz.json 2>/dev/null || true
  exit 1
fi
echo "health OK (http=$code)"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to validate L2/L3 response body" >&2
  exit 1
fi

BODY="$(MODEL_JSON="$QWEN_MODEL" PROMPT_JSON="$WEB_MODEL_TEST_PROMPT" node -e '
const model = process.env.MODEL_JSON;
const prompt = process.env.PROMPT_JSON;
console.log(JSON.stringify({ model, messages: [{ role: "user", content: prompt }], stream: false }));
')"

echo ""
echo "==> [L2] POST ${BASE}/v1/chat/completions model=${QWEN_MODEL}"
resp_code="$(curl -sS -o /tmp/openclaw-chat-qwen-cn.json -w "%{http_code}" \
  -X POST "${BASE}/v1/chat/completions" \
  -H "Authorization: Bearer ${WEB_MODEL_TEST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$BODY")"

echo "HTTP $resp_code"
if [[ "$resp_code" != "200" ]]; then
  head -c 2000 /tmp/openclaw-chat-qwen-cn.json >&2 || true
  echo >&2
  exit 1
fi

content="$(jq -r '.choices[0].message.content // empty' /tmp/openclaw-chat-qwen-cn.json)"
if [[ -z "${content// }" ]]; then
  echo "L2: Response 200 but choices[0].message.content is empty" >&2
  head -c 1500 /tmp/openclaw-chat-qwen-cn.json >&2
  echo >&2
  exit 1
fi
echo "L2 assistant reply (excerpt): ${content:0:200}$([[ ${#content} -gt 200 ]] && echo ...)"

echo ""
echo "==> [L3] openclaw agent --model ${QWEN_MODEL}"
AGENT_OUT="$(mktemp)"
node openclaw.mjs agent --agent main --model "$QWEN_MODEL" --message "$WEB_MODEL_TEST_PROMPT" --json >"$AGENT_OUT"
node -e '
const fs = require("node:fs");
const raw = fs.readFileSync(process.argv[1], "utf8");
const j = JSON.parse(raw);
const payloads = j?.result?.payloads;
const text = Array.isArray(payloads) && payloads[0] && typeof payloads[0].text === "string"
  ? payloads[0].text.trim() : "";
if (!text) {
  console.error("L3: agent --json has no result.payloads[0].text:", raw.slice(0, 800));
  process.exit(1);
}
console.log("L3 assistant reply (excerpt):", text.slice(0, 200) + (text.length > 200 ? "..." : ""));
' "$AGENT_OUT"
rm -f "$AGENT_OUT"

echo ""
echo "qwen-cn-web full flow (L1+L2+L3) completed."

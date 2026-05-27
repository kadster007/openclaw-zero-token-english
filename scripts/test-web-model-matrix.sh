#!/usr/bin/env bash
# Web Model HTTP smoke test matrix: send one /v1/chat/completions per provider (equivalent to selecting a model in Web UI via OpenAI compatible entry).
# Excluded (already verified): claude-web, gemini-web, deepseek-web, doubao-web, glm-web, glm-intl-web, xiaomimo-web
# Dependencies: Gateway started + each provider onboarded; environment variables below.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/web-model-http-matrix.inc.sh
source "$ROOT/scripts/web-model-http-matrix.inc.sh"

UNIT_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --unit-only) UNIT_ONLY=true ;;
    *)
      echo "Unknown argument: $arg (supports --unit-only: only run offline Vitest)" >&2
      exit 2
      ;;
  esac
done

echo "==> [Matrix-Phase 1] Zero Token web stream unit tests"
pnpm exec vitest run --config scripts/vitest.zero-token-web.config.ts

if [[ "$UNIT_ONLY" == true ]]; then
  echo "Using --unit-only, skipping HTTP matrix."
  exit 0
fi

if [[ -z "${WEB_MODEL_TEST_URL:-}" || -z "${WEB_MODEL_TEST_TOKEN:-}" ]]; then
echo ""
echo "WEB_MODEL_TEST_URL / WEB_MODEL_TEST_TOKEN not set, skipping HTTP live test matrix."
echo "To run the full matrix, set them and retry, e.g.:"
echo "  export WEB_MODEL_TEST_URL=http://127.0.0.1:3001"
echo "  export WEB_MODEL_TEST_TOKEN=<gateway.auth.token>"
echo "  bash scripts/test-web-model-matrix.sh"
  exit 0
fi

BASE="${WEB_MODEL_TEST_URL%/}"
PROMPT="${WEB_MODEL_TEST_PROMPT:-Answer in one sentence: what is 2+3=? Output only the number.}"

echo ""
echo "==> [Matrix-Health Check] ${BASE}/healthz"
code="$(curl -sS -o /tmp/openclaw-mx-health.json -w "%{http_code}" "${BASE}/healthz" || true)"
if [[ "$code" != "200" ]]; then
  code="$(curl -sS -o /tmp/openclaw-mx-health.json -w "%{http_code}" "${BASE}/health" || true)"
fi
if [[ "$code" != "200" ]]; then
  echo "Gateway unreachable (http=$code), skipping matrix." >&2
  cat /tmp/openclaw-mx-health.json 2>/dev/null || true
  exit 1
fi
echo "health OK"

failed=0
for model in "${WEB_MODEL_MATRIX_ENTRIES[@]}"; do
  echo ""
  echo "==> [Matrix] model=${model}"
  BODY="$(MODEL_JSON="$model" PROMPT_JSON="$PROMPT" node -e '
const model = process.env.MODEL_JSON;
const prompt = process.env.PROMPT_JSON;
console.log(JSON.stringify({
  model,
  messages: [{ role: "user", content: prompt }],
  stream: false,
}));
')"
  resp_code="$(curl -sS -o /tmp/openclaw-mx-chat.json -w "%{http_code}" \
    -X POST "${BASE}/v1/chat/completions" \
    -H "Authorization: Bearer ${WEB_MODEL_TEST_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$BODY")"
  if [[ "$resp_code" != "200" ]]; then
    echo "  FAIL HTTP $resp_code" >&2
    head -c 1200 /tmp/openclaw-mx-chat.json >&2 || true
    echo >&2
    failed=$((failed + 1))
    continue
  fi
  if command -v jq >/dev/null 2>&1; then
    content="$(jq -r '.choices[0].message.content // empty' /tmp/openclaw-mx-chat.json)"
    if [[ -z "${content// }" ]]; then
      echo "  FAIL 200 but content is empty" >&2
      failed=$((failed + 1))
      continue
    fi
    echo "  OK reply excerpt: ${content:0:120}$([[ ${#content} -gt 120 ]] && echo ...)"
  else
    echo "  OK (jq not installed, content not validated)"
  fi
done

echo ""
if [[ "$failed" -gt 0 ]]; then
  echo "Matrix complete: ${failed} of ${#WEB_MODEL_MATRIX_ENTRIES[@]} entries failed." >&2
  exit 1
fi
echo "Matrix complete: all ${#WEB_MODEL_MATRIX_ENTRIES[@]} entries passed."

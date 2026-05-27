#!/usr/bin/env bash
# ============================================================================
# Web Model End-to-End Automated Test
# ============================================================================
# Full test flow: build → start browser debug → auth → start gateway → send message to each authorized model → verify response
#
# All ports, config files, and state directories use zero-token isolated paths, not shared with system openclaw.
#
# Usage:
#   bash scripts/test-web-model-e2e.sh                # Full flow (with build)
#   bash scripts/test-web-model-e2e.sh --skip-build   # Skip build
#   bash scripts/test-web-model-e2e.sh --skip-auth    # Skip auth (already authorized)
#   bash scripts/test-web-model-e2e.sh --models "qwen-cn-web/Qwen3.5-Plus,deepseek-web/deepseek-chat"
#   bash scripts/test-web-model-e2e.sh --help
#
# Environment variables (optional override):
#   ZT_GATEWAY_PORT     Gateway port (default 3001)
#   ZT_CHROME_PORT      Chrome CDP port (default 9222)
#   ZT_TIMEOUT          Single model request timeout in seconds (default 120)
#   ZT_PROMPT           Test prompt
# ============================================================================
set -euo pipefail

# ─── Project Paths (zero-token isolated, not shared with system openclaw) ──
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# zero-token specific paths
ZT_STATE_DIR="$ROOT/.openclaw-upstream-state"
ZT_CONFIG_FILE="$ZT_STATE_DIR/openclaw.json"
ZT_AUTH_FILE="$ZT_STATE_DIR/agents/main/agent/auth-profiles.json"
ZT_PID_FILE="$ROOT/.gateway-test.pid"
ZT_GATEWAY_PORT="${ZT_GATEWAY_PORT:-3001}"
ZT_CHROME_PORT="${ZT_CHROME_PORT:-9222}"
ZT_TIMEOUT="${ZT_TIMEOUT:-120}"
ZT_PROMPT="${ZT_PROMPT:-Answer in one sentence: what is 2+3? Output only the number.}"
ZT_BASE_URL="http://127.0.0.1:${ZT_GATEWAY_PORT}"

# ─── Color Output ─────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[PASS]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }
step()  { echo -e "\n${CYAN}══════════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}══════════════════════════════════════════${NC}"; }

# ─── Argument Parsing ─────────────────────────────────────────────────
SKIP_BUILD=false
SKIP_AUTH=false
SKIP_BROWSER=false
SELECTED_MODELS=""
CLEANUP_ON_EXIT=true

show_help() {
  cat <<'HELP'
Web Model End-to-End Test

Usage: bash scripts/test-web-model-e2e.sh [options]

Options:
  --skip-build       Skip build step (already built)
  --skip-auth        Skip auth step (already authorized)
  --skip-browser     Skip browser launch (already running)
  --models LIST      Only test specified models, comma-separated
                     Example: --models "qwen-cn-web/Qwen3.5-Plus,kimi-web/moonshot-v1-32k"
  --no-cleanup       Don't stop gateway after test
  --help             Show this help

Environment variables:
  ZT_GATEWAY_PORT    Gateway port (default 3001)
  ZT_CHROME_PORT     Chrome CDP port (default 9222)
  ZT_TIMEOUT         Single model timeout in seconds (default 120)
  ZT_PROMPT          Test prompt

Path notes (zero-token isolated, not shared with system openclaw):
  Config file    .openclaw-upstream-state/openclaw.json
  Auth credentials .openclaw-upstream-state/agents/main/agent/auth-profiles.json
  Gateway port    Default 3001 (system openclaw uses 3000)
  Browser data   ~/Library/Application Support/Chrome-OpenClaw-Debug (mac)
                 ~/.config/chrome-openclaw-debug (linux)
HELP
  exit 0
}

for arg in "$@"; do
  case "$arg" in
    --skip-build)   SKIP_BUILD=true ;;
    --skip-auth)    SKIP_AUTH=true ;;
    --skip-browser) SKIP_BROWSER=true ;;
    --no-cleanup)   CLEANUP_ON_EXIT=false ;;
    --help|-h)      show_help ;;
      --models)       :;; # Next arg is the value
    --models=*)     SELECTED_MODELS="${arg#*=}" ;;
    *)
      # Check if this is the value of --models
      prev="${*:$((${#@}-1)):1}"
      if [[ "${prev:-}" == "--models" ]]; then
        SELECTED_MODELS="$arg"
      fi
      ;;
  esac
done

# More robust --models parsing
i=0
for arg in "$@"; do
  i=$((i + 1))
  if [[ "$arg" == "--models" ]]; then
    next_i=$((i + 1))
    j=0
    for a2 in "$@"; do
      j=$((j + 1))
      if [[ "$j" == "$next_i" ]]; then
        SELECTED_MODELS="$a2"
        break
      fi
    done
  fi
done

# ─── Pre-checks ────────────────────────────────────────────────────
step "Phase 0: Pre-checks"

check_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "$1 not found, please install it"
    return 1
  fi
  ok "$1 is installed"
}

check_tool node
check_tool curl
check_tool jq || warn "jq not installed, response validation will degrade"

NODE="$(command -v node)"
info "Node version: $($NODE --version)"
info "Project root: $ROOT"
info "State directory: $ZT_STATE_DIR"
info "Config file: $ZT_CONFIG_FILE"
info "Gateway port: $ZT_GATEWAY_PORT"
info "Chrome CDP port: $ZT_CHROME_PORT"

# Ensure config file and state directory exist
if [[ ! -f "$ZT_CONFIG_FILE" ]]; then
  warn "Config file not found, will copy from example"
  mkdir -p "$ZT_STATE_DIR"
  EXAMPLE_CONFIG="$ROOT/.openclaw-state.example/openclaw.json"
  if [[ -f "$EXAMPLE_CONFIG" ]]; then
    cp "$EXAMPLE_CONFIG" "$ZT_CONFIG_FILE"
    ok "Config copied: $EXAMPLE_CONFIG → $ZT_CONFIG_FILE"
  else
    fail "Example config file not found: $EXAMPLE_CONFIG"
    exit 1
  fi
fi

# Read gateway token
GATEWAY_TOKEN=$(jq -r '.gateway.auth.token // empty' "$ZT_CONFIG_FILE" 2>/dev/null || true)
if [[ -z "$GATEWAY_TOKEN" ]]; then
  warn "gateway.auth.token not found in config file, some tests may fail"
  GATEWAY_TOKEN="test-token"
fi

# ─── Phase 1: Build ───────────────────────────────────────────────
if [[ "$SKIP_BUILD" == true ]]; then
  step "Phase 1: Build [Skipped]"
else
  step "Phase 1: Build project"

  info "Running pnpm build ..."
  if pnpm build 2>&1 | tail -5; then
    ok "Build successful"
  else
    fail "Build failed"
    exit 1
  fi

  # Verify build artifacts
  if [[ -f "$ROOT/openclaw.mjs" ]]; then
    ok "Entry file exists: openclaw.mjs"
  else
    fail "Entry file does not exist: openclaw.mjs"
    exit 1
  fi

  if [[ -d "$ROOT/dist" ]]; then
    DIST_FILES=$(find "$ROOT/dist" -name "*.js" | wc -l | tr -d ' ')
    ok "dist directory contains ${DIST_FILES} JS files"
  else
    fail "dist directory does not exist"
    exit 1
  fi
fi

# ─── Phase 1.5: Unit Tests ────────────────────────────────────────
step "Phase 1.5: Web Stream Unit Tests"

if pnpm exec vitest run --config scripts/vitest.zero-token-web.config.ts 2>&1 | tail -10; then
  ok "Unit tests passed"
else
  warn "Unit tests failed (does not block subsequent tests)"
fi

# ─── Phase 2: Start Chrome Debug Mode ─────────────────────────────
if [[ "$SKIP_BROWSER" == true ]]; then
  step "Phase 2: Start Chrome Debug Mode [Skipped]"
else
  step "Phase 2: Start Chrome Debug Mode"

  # Check if debug Chrome is already running
  if curl -s "http://127.0.0.1:${ZT_CHROME_PORT}/json/version" > /dev/null 2>&1; then
    ok "Chrome debug mode already running (port ${ZT_CHROME_PORT})"
    CHROME_VERSION=$(curl -s "http://127.0.0.1:${ZT_CHROME_PORT}/json/version" | jq -r '.Browser // "unknown"' 2>/dev/null || echo "unknown")
    info "Chrome version: $CHROME_VERSION"
  else
    info "Starting Chrome debug mode..."
    if [[ -x "$ROOT/start-chrome-debug.sh" ]]; then
      # Launch in background (script waits for Chrome to be ready then exits)
      bash "$ROOT/start-chrome-debug.sh" &
      CHROME_LAUNCHER_PID=$!

      # Wait for Chrome CDP to be available
      info "Waiting for Chrome to be ready..."
      CHROME_READY=false
      for i in $(seq 1 30); do
        if curl -s "http://127.0.0.1:${ZT_CHROME_PORT}/json/version" > /dev/null 2>&1; then
          CHROME_READY=true
          break
        fi
        sleep 1
      done

      if [[ "$CHROME_READY" == true ]]; then
        ok "Chrome debug mode started"
      else
        fail "Chrome startup timed out (30s)"
        warn "Please run manually: ./start-chrome-debug.sh"
        warn "Then re-run this test with --skip-browser"
        exit 1
      fi
    else
      fail "start-chrome-debug.sh does not exist or is not executable"
      exit 1
    fi
  fi
fi

# ─── Phase 3: Web Model Auth ──────────────────────────────────────
if [[ "$SKIP_AUTH" == true ]]; then
  step "Phase 3: Web Model Auth [Skipped]"
else
  step "Phase 3: Web Model Auth Check"

  if [[ -f "$ZT_AUTH_FILE" ]]; then
    AUTH_PROFILES=$(jq -r '.profiles | keys[]' "$ZT_AUTH_FILE" 2>/dev/null || true)
    WEB_PROFILES=$(echo "$AUTH_PROFILES" | grep -E ".*-web:" || true)

    if [[ -n "$WEB_PROFILES" ]]; then
      info "Found the following Web model authorizations:"
      echo "$WEB_PROFILES" | while read -r profile; do
        ok "  $profile"
      done
    else
      warn "No Web model authorizations found"
      warn "Please run: ./onboard.sh webauth"
      warn "After authorization, re-run this test with --skip-auth"
      exit 1
    fi
  else
    warn "auth-profiles.json not found"
    warn "Please run: ./onboard.sh webauth first"
    exit 1
  fi
fi

# ─── Phase 4: Start Gateway ───────────────────────────────────────
step "Phase 4: Start Gateway"

# Check if gateway is already running
GATEWAY_RUNNING=false
if curl -s -o /dev/null --connect-timeout 2 "${ZT_BASE_URL}/healthz" 2>/dev/null; then
  GATEWAY_RUNNING=true
  ok "Gateway already running (${ZT_BASE_URL})"
elif curl -s -o /dev/null --connect-timeout 2 "${ZT_BASE_URL}/health" 2>/dev/null; then
  GATEWAY_RUNNING=true
  ok "Gateway already running (${ZT_BASE_URL})"
fi

if [[ "$GATEWAY_RUNNING" == false ]]; then
  info "Starting gateway..."

  # Ensure old process is stopped
  if [[ -f "$ZT_PID_FILE" ]]; then
    OLD_PID=$(cat "$ZT_PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
      info "Stopping old gateway process (PID: $OLD_PID)"
      kill "$OLD_PID" 2>/dev/null || true
      sleep 2
    fi
    rm -f "$ZT_PID_FILE"
  fi

  # zero-token isolated environment variables
  export OPENCLAW_CONFIG_PATH="$ZT_CONFIG_FILE"
  export OPENCLAW_STATE_DIR="$ZT_STATE_DIR"
  export OPENCLAW_GATEWAY_PORT="$ZT_GATEWAY_PORT"

  GW_LOG="/tmp/openclaw-e2e-gateway.log"
  nohup "$NODE" "$ROOT/openclaw.mjs" gateway --port "$ZT_GATEWAY_PORT" > "$GW_LOG" 2>&1 &
  GW_PID=$!
  echo "$GW_PID" > "$ZT_PID_FILE"
  info "Gateway PID: $GW_PID, log: $GW_LOG"

  # Wait for readiness
  GW_READY=false
  for i in $(seq 1 30); do
    if curl -s -o /dev/null --connect-timeout 1 "${ZT_BASE_URL}/" 2>/dev/null; then
      GW_READY=true
      break
    fi
    if ! kill -0 $GW_PID 2>/dev/null; then
      fail "Gateway process exited, check log: $GW_LOG"
      tail -20 "$GW_LOG" 2>/dev/null || true
      exit 1
    fi
    sleep 1
  done

  if [[ "$GW_READY" == true ]]; then
    ok "Gateway ready (${i}s)"
  else
    fail "Gateway startup timed out (30s), check log: $GW_LOG"
    tail -30 "$GW_LOG" 2>/dev/null || true
    exit 1
  fi
fi

# Health check
HEALTH_CODE=$(curl -sS -o /tmp/zt-e2e-health.json -w "%{http_code}" "${ZT_BASE_URL}/healthz" 2>/dev/null || echo "000")
if [[ "$HEALTH_CODE" != "200" ]]; then
  HEALTH_CODE=$(curl -sS -o /tmp/zt-e2e-health.json -w "%{http_code}" "${ZT_BASE_URL}/health" 2>/dev/null || echo "000")
fi

if [[ "$HEALTH_CODE" == "200" ]]; then
  ok "Health check passed (HTTP $HEALTH_CODE)"
else
  fail "Health check failed (HTTP $HEALTH_CODE)"
  cat /tmp/zt-e2e-health.json 2>/dev/null || true
  exit 1
fi


# ─── Phase 5+: Run E2E Test Runner ────────────────────────────────
step "Phase 5: Run E2E Tests (L2 + L3 + L5)"

# Pass environment variables to TypeScript runner
export ZT_GATEWAY_PORT="$ZT_GATEWAY_PORT"
export ZT_CHROME_PORT="$ZT_CHROME_PORT"
export ZT_TIMEOUT="$ZT_TIMEOUT"
export ZT_GATEWAY_TOKEN="$GATEWAY_TOKEN"
export ZT_REPORT_DIR="$ROOT/reports"

if [[ -n "$SELECTED_MODELS" ]]; then
  export ZT_MODELS="$SELECTED_MODELS"
fi

# Support skipping specific layers
for arg in "$@"; do
  case "$arg" in
    --skip-l2) export ZT_SKIP_L2=1 ;;
    --skip-l3) export ZT_SKIP_L3=1 ;;
    --skip-l5) export ZT_SKIP_L5=1 ;;
  esac
done

info "Invoking TypeScript E2E Runner..."
info "  L2 HTTP:       ${ZT_SKIP_L2:+Skipped}${ZT_SKIP_L2:-Enabled}"
info "  L3 WebSocket:  ${ZT_SKIP_L3:+Skipped}${ZT_SKIP_L3:-Enabled}"
info "  L5 Browser UI: ${ZT_SKIP_L5:+Skipped}${ZT_SKIP_L5:-Enabled}"
echo ""

RUNNER_EXIT=0
"$NODE" --import tsx "$ROOT/scripts/test-web-e2e-runner.ts" || RUNNER_EXIT=$?

# ─── Cleanup ─────────────────────────────────────────────────────
if [[ "$CLEANUP_ON_EXIT" == true && -f "$ZT_PID_FILE" ]]; then
  GW_PID=$(cat "$ZT_PID_FILE" 2>/dev/null || true)
  if [[ -n "$GW_PID" ]] && kill -0 "$GW_PID" 2>/dev/null; then
    info "Stopping test gateway (PID: $GW_PID)"
    kill "$GW_PID" 2>/dev/null || true
    rm -f "$ZT_PID_FILE"
  fi
fi

# Output path confirmation
echo ""
info "Path confirmation (zero-token isolated, not shared with system openclaw):"
info "  Config file:   $ZT_CONFIG_FILE"
info "  Auth credentials: $ZT_AUTH_FILE"
info "  Gateway port:   $ZT_GATEWAY_PORT"
info "  Chrome port:   $ZT_CHROME_PORT"
info "  State directory: $ZT_STATE_DIR"
info "  Report directory: $ZT_REPORT_DIR"

exit $RUNNER_EXIT

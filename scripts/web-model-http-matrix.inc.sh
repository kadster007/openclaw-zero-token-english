# shellcheck shell=bash
# Sourced by test-web-model-matrix.sh and test-web-model-e2e.sh;
# Defines providers/models to test (consistent with src/zero-token/bridge/web-providers.ts directory).

# Full Web model matrix (13 providers)
WEB_MODEL_MATRIX_ENTRIES=(
  "claude-web/claude-sonnet-4-6"
  "chatgpt-web/gpt-4"
  "deepseek-web/deepseek-chat"
  "doubao-web/doubao-seed-2.0"
  "qwen-web/qwen3.5-plus"
  "qwen-cn-web/Qwen3.5-Plus"
  "kimi-web/moonshot-v1-32k"
  "gemini-web/gemini-pro"
  "grok-web/grok-2"
  "glm-web/glm-4-plus"
  "glm-intl-web/glm-4-plus"
  "perplexity-web/perplexity-web"
  "xiaomimo-web/xiaomimo-chat"
)

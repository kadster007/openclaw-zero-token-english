# Zero Token (Fork Documentation)

This directory contains **openclaw-zero-token** product documentation, sync checklist, and Web model docs relative to upstream OpenClaw; intended to be read alongside the implementation tree **`src/zero-token/`**.

| Doc                                                                        | Description                                              |
| --------------------------------------------------------------------------- | -------------------------------------------------------- |
| [Requirements & Evolution Tracking](/zero-token/zero-token-requirements)    | Goals, constraints, change log (primarily Chinese)       |
| [Upstream Sync](/zero-token/upstream-sync)                                  | Change surface checklist and steps for merge/rebase      |
| [Web Model Support](/zero-token/web-models-support)                         | Architecture, Provider list, development & AskOnce       |
| [Web Model Tool Calling](/zero-token/web-tool-calling)                      | Prompt injection principles, full flow, templates, validation results |
| [Browser & CDP Modes](/zero-token/web-models-browser-modes)                 | Debug Chrome, Profile, bb-browser reference              |
| [Web Model Test Flow](/zero-token/web-model-test-flow)                      | Offline unit tests, HTTP matrix/live tests, CLI+chat.send E2E, manual testing & troubleshooting |
| [Web Model Test Report (cases/layers/per-model table)](/zero-token/WEB_MODEL_TEST_REPORT) | Exact definition of "pass", case IDs, per-provider status & evidence requirements |
| [Refactor Implementation Plan](/zero-token/plans/2026-03-28-zero-token-refactor) | Historical implementation plan and validation records |

You can also open these directly on GitHub: corresponding `.md` files under `docs/zero-token/`.

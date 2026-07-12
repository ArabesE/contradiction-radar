# Decision log

## 2026-07-12 — Local Socket Mode runtime

Use Bolt for JavaScript with TypeScript and Socket Mode. This avoids paid hosting and a public endpoint while remaining reachable whenever the dedicated Windows host is online.

## 2026-07-12 — Current Agent messaging experience

Use manifest `features.agent_view`, not `assistant_view`. Handle `app_home_opened`, `app_context_changed`, and `message.im` directly. Slack announced on 2026-06-30 that new agents can only use this experience and requires Slack CLI 4.4.0 plus `@slack/web-api` 7.18.0 or newer.

## 2026-07-12 — Permission-aware retrieval

Use `assistant.search.info` once per runtime/team cache window and `assistant.search.context` in response to a user action. The bot token call always includes the Slack event `action_token`. Do not use legacy `search.messages`.

## 2026-07-12 — Local inference baseline

Use `Xenova/nli-deberta-v3-xsmall` through `@huggingface/transformers` as quantized ONNX, pinned at repository revision `2a4f614a701367a02d51389039afc998faeda637`. The source model `cross-encoder/nli-deberta-v3-xsmall` declares Apache-2.0. Validate the explicit contradiction/entailment/neutral mapping against the repository evaluation set. Preserve the deterministic fallback if initialization fails.

## 2026-07-12 — Conservative ensemble

NLI is advisory. Explicit version/environment/time/scope differences override a raw contradiction score. Proposal language cannot produce a direct-conflict label. Low margin or missing context becomes Needs clarification.

## 2026-07-12 — Minimal retention

Do not store Slack message bodies. Persist feedback identifiers and reason codes only. Local logs contain timestamps, event IDs, latency, result counts, and error categories.

## 2026-07-12 — Challenge requirements

Official Devpost rules require a newly created eligible agent, English submission, public video under three minutes, architecture diagram, sandbox URL, and judge access. The deadline is 2026-07-13 17:00 PDT (20:00 EDT). Repository remains private until final audits pass.

## 2026-07-12 — Workspace-granted direct runtime

Run the installed workspace bot and app-level Socket Mode token directly through the compiled Node entrypoint. Slack CLI remains a development/manifest tool, not the long-running process supervisor. This avoids duplicate socket connections and makes the exact workspace identity verifiable with `auth.test`.

## 2026-07-12 — Durable Windows operation

Use a per-user Task Scheduler logon trigger named `Contradiction Radar`. `scripts/start.ps1` prevents duplicate processes, uses the Node 24 runtime, redirects body-free logs to ignored local storage, and records a PID. `npm run restart` rebuilds and replaces the process; `npm run health` checks team identity and search capability.

## 2026-07-12 — Honest evaluation claim

Report 28/28 only as exact performance on the frozen, hand-authored regression fixture. Explicitly state that the fixture is small, balanced, and product-designed—not an independent real-world benchmark. Retain the live Slack tests as separate integration evidence.

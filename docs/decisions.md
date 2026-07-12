# Decision log

## 2026-07-12 — Local Socket Mode runtime

Use Bolt for JavaScript with TypeScript and Socket Mode. This avoids paid hosting and a public endpoint while remaining reachable whenever the dedicated Windows host is online.

## 2026-07-12 — Current Agent messaging experience

Use manifest `features.agent_view`, not `assistant_view`. Handle `app_home_opened`, `app_context_changed`, and `message.im` directly. Slack announced on 2026-06-30 that new agents can only use this experience and requires Slack CLI 4.4.0 plus `@slack/web-api` 7.18.0 or newer.

## 2026-07-12 — Permission-aware retrieval

Use `assistant.search.info` once per runtime/team cache window and `assistant.search.context` in response to a user action. The bot token call always includes the Slack event `action_token`. Do not use legacy `search.messages`.

## 2026-07-12 — Local inference baseline

Start with `Xenova/nli-deberta-v3-xsmall` through `@huggingface/transformers`, quantized ONNX where available. The runtime must validate label mapping and accuracy against the repository evaluation set. If initialization or licensing is unsuitable, preserve the deterministic fallback and document any replacement here.

## 2026-07-12 — Conservative ensemble

NLI is advisory. Explicit version/environment/time/scope differences override a raw contradiction score. Proposal language cannot produce a direct-conflict label. Low margin or missing context becomes Needs clarification.

## 2026-07-12 — Minimal retention

Do not store Slack message bodies. Persist feedback identifiers and reason codes only. Local logs contain timestamps, event IDs, latency, result counts, and error categories.

## 2026-07-12 — Challenge requirements

Official Devpost rules require a newly created eligible agent, English submission, public video under three minutes, architecture diagram, sandbox URL, and judge access. The deadline is 2026-07-13 17:00 PDT (20:00 EDT). Repository remains private until final audits pass.


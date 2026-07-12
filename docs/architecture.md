# Architecture

Contradiction Radar is a local TypeScript service built on Bolt for JavaScript and Slack Socket Mode. Slack remains the system of record and permission boundary. The service holds no public HTTP endpoint.

## Request path

1. Slack delivers `message.im`, `app_home_opened`, `app_context_changed`, and Block Kit actions over Socket Mode.
2. The Bolt adapter validates the event shape, uses the event `action_token`, and extracts the current Slack context.
3. The retrieval adapter calls `assistant.search.info` and `assistant.search.context`. It uses at most two search calls per user inquiry and returns Slack permalinks.
4. Pure preprocessing extracts one claim and context markers.
5. A quantized ONNX NLI model runs locally. A deterministic fallback remains available if initialization fails.
6. The policy layer combines NLI scores with scope/time/environment/version/authority/status rules and returns at most three findings.
7. The Block Kit renderer sends evidence cards to the requesting user's agent DM.
8. Feedback actions append minimal structured metadata to a local JSONL store; no message bodies are persisted.

## Trust boundaries

- Slack client and Slack APIs: remote, permission-enforcing boundary.
- Socket Mode/Bolt process: local trusted runtime containing ephemeral message text.
- Local model and rule engine: local-only processing; no model API calls.
- Feedback/log files: local persistent storage, deliberately body-free.

The editable diagram is `docs/architecture.drawio`; exported copies are `docs/architecture.svg` and `docs/architecture.png`.


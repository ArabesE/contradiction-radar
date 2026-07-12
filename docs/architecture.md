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

## Data-flow invariants

| Stage | Receives raw Slack text? | Persists raw text? | External network destination |
| --- | --- | --- | --- |
| Slack RTS | Yes, Slack system of record | Slack-controlled | Slack only |
| Local retrieval/preprocessing | Yes, transiently | No | None |
| Local ONNX NLI | Yes, pairwise and transiently | Model cache only; no message text | Hugging Face only for the pinned model download |
| Policy and Block Kit rendering | Yes, transiently | No | Slack response API |
| Feedback | No | IDs, labels, reason codes, timestamps | None |
| Logs | No | Operational metadata/error categories | None |

## Retrieval and classification limits

- A user-triggered message event supplies the `action_token` used with bot-token RTS calls.
- The retrieval adapter makes at most one semantic query plus one keyword query and requests no more than 20 results.
- Context messages are normalized individually; exact `(channel_id, message_ts)` pairs are de-duplicated.
- Ordinary bot messages are ignored. Only explicit `[DEMO DATA]` bot fixtures can enter the demonstration corpus.
- The local NLI model is pinned by repository revision and loaded as quantized ONNX.
- Deterministic rules can downgrade an apparent contradiction when scope, environment, version, time, proposal status, or supersession explains the difference.
- Ranking returns at most three findings and exposes the evidence, never an automated organizational decision.

## Operations

The production demo host uses `scripts/start.ps1` and a per-user Windows logon task named `Contradiction Radar`. The start script prevents duplicate processes, builds when required, stores an ignored PID, and redirects body-free logs under `data/runtime/`. `npm run restart` replaces the service cleanly; `npm run health` checks workspace identity and RTS capability.

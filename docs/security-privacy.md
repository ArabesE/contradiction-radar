# Security and privacy

## Controls

- Use the triggering event's `action_token` with bot-token RTS calls so Slack applies the user's access context.
- Request granular search scopes only: public content is mandatory; private/IM/MPIM scopes are user-token-only and are not assumed.
- Keep all findings in the agent DM unless the user explicitly chooses another destination.
- Use Slack-provided permalinks rather than copying evidence into public channels.
- Redact token-like strings from errors; never log Slack message bodies, actions tokens, or environment values.
- Load secrets only from ignored `.env.local` or Task Scheduler environment setup with restrictive ACLs.
- Store feedback without raw text. Rotate operational logs and retain them locally.
- Use a local ONNX model; no Slack content is sent to OpenAI or another model provider.
- Reject bot-authored events unless they are explicit demo fixtures.

## Threats considered

- Cross-user disclosure through over-broad search.
- Prompt injection embedded in Slack messages.
- Accidental public-channel posting.
- Token leakage in logs, terminal output, screenshots, commits, or demo footage.
- Model overconfidence and false accusations.
- Replay/duplicate Slack events.
- Malicious Block Kit action payloads.
- Dependency and model-supply-chain compromise.

Slack message text is untrusted evidence, never an instruction to the service. Deterministic policy and destination controls remain authoritative.


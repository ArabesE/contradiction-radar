# Security and privacy

## Controls

- Use the triggering event's `action_token` with bot-token RTS calls so Slack applies the user's access context.
- Request granular search scopes only: public content is mandatory; private/IM/MPIM scopes are user-token-only and are not assumed.
- Keep all findings in the agent DM unless the user explicitly chooses another destination.
- Use Slack-provided permalinks rather than copying evidence into public channels.
- Redact token-like strings from errors; never log Slack message bodies, actions tokens, or environment values.
- Load secrets only from ignored `.env.local` on Windows or the restricted `/etc/contradiction-radar.env` file on the cloud VM.
- Store feedback without raw text. Rotate operational logs and retain them only on private worker storage.
- Bound interactive finding state to 500 entries and ten minutes, actively sweep expiry, and consume a finding when **Add context** uses it.
- Bound untrusted Slack text before any normalization regex or self-hosted inference work.
- Use a self-hosted ONNX model inside the private worker; no Slack content is sent to OpenAI or another model provider.
- Pin the Transformers.js model repository revision; review the upstream Apache-2.0 model card and dependency lockfile before release.
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

## Data lifecycle

Raw message content exists only in the Slack event/search response and in-memory claim/evidence objects. It is not included in Pino fields, exception messages, health output, evaluation output, feedback records, or scheduled-task configuration. To support **Add context**, a rendered finding may remain in a process-local cache for at most ten minutes. That cache is hard-limited to 500 entries, actively swept, origin-bound to the initiating user/channel/thread, and single-use. Pending added-context state is separately capped at 250 entries with the same maximum lifetime. A process restart releases both caches.

`data/feedback.jsonl` contains `findingId`, action, actor/channel/thread identifiers, optional earlier-message timestamp, predicted label, reason codes, and creation time. `data/runtime/` contains a PID and body-free operational logs. Both paths are ignored by Git; the feedback file is created with restrictive permissions.

## Scope rationale

| Scope | Reason |
| --- | --- |
| `assistant:write` | Agent status/threaded response affordances |
| `chat:write` | Send findings and acknowledgements |
| `chat:write.customize` | Demo persona labels on explicit seeded fixtures |
| `im:history` | Receive and reply in the agent DM |
| `search:read.public` | Retrieve public-channel evidence through RTS |

General channel-history, private-channel, MPIM, user-search, file-search, and file-read scopes are intentionally absent. Demo seeding uses the configured channel ID through `chat:write.customize` and first verifies the bot token's workspace identity.

## Recovery and rotation

- A compromised or accidentally displayed token must be revoked immediately, replaced in ignored `.env.local` for a Windows installation or `/etc/contradiction-radar.env` on the cloud VM, and followed by a service restart and history scan.
- If the model cannot load from the pinned revision, the runtime logs a category-only warning and uses the deterministic fallback.
- Search failure produces an honest retry/health response; it never reuses evidence from another user or fabricates a finding.
- Reinstalling the Slack app requires revalidating `SLACK_TEAM_ID` with `npm run health`.

## Authoritative references

- [Slack Real-time Search API](https://docs.slack.dev/apis/web-api/real-time-search-api/)
- [`assistant.search.context` method](https://docs.slack.dev/reference/methods/assistant.search.context/)
- [Slack agent context management](https://docs.slack.dev/ai/agent-context-management)
- [Upstream NLI model card and Apache-2.0 declaration](https://huggingface.co/cross-encoder/nli-deberta-v3-xsmall)

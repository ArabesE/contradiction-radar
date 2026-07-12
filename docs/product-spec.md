# Product specification

## Product promise

Contradiction Radar helps a Slack user check whether a current requirement, decision, constraint, commitment, deadline, permission, or technical assertion may conflict with earlier messages the same user is allowed to read. It presents exact evidence, a conservative explanation, and human controls. It never makes an organizational decision on the user's behalf.

## Primary flow

1. The user opens the agent Messages tab while viewing a Slack message, or pastes/types a current claim.
2. The agent extracts one checkable claim or asks one precise clarifying question.
3. The agent checks `assistant.search.info`, then performs one semantic question and/or one keyword search through `assistant.search.context` using the event `action_token`.
4. Up to 20 candidates are normalized; at most three high-value findings are shown.
5. A local NLI model estimates entailment, contradiction, and neutrality. Deterministic policy checks scope, time, environment, version, authority, proposal status, and supersession.
6. Each evidence card shows the current claim, previous evidence, label, cautious explanation, confidence, and Slack permalinks.
7. The user can add context, mark resolved, or report a false positive. Added context causes a fresh classification.

## Labels

- Direct contradiction
- Requirement conflict
- Superseded decision
- Scope mismatch
- Time mismatch
- Needs clarification
- No contradiction

## Quality bar

- Precision is more important than recall.
- Ambiguous differences never receive a certainty claim.
- Proposal/preference language cannot be promoted into a final decision.
- Version, environment, customer-group, or time-window differences downgrade a contradiction.
- Results remain in the agent DM by default and include source permalinks.
- Search/model failures produce an honest next step and never fabricate evidence.

## Privacy and retention

The app passes user-triggered Slack content only to Slack's permission-aware APIs and a local process on the development host. Raw message bodies are processed transiently and are not written to disk. Logs contain operational metadata only. Feedback stores only message identifiers/permalinks, chosen labels, reason codes, actor IDs, and timestamps.

## Non-goals

- General-purpose Slack summarization or chat.
- Automated enforcement, compliance judgment, or public call-outs.
- Training on workspace content.
- Remote model inference.
- Access to messages the requesting user cannot already read.


# Devpost draft copy

## Project name

Contradiction Radar

## Tagline

Catch decision drift in Slack before yesterday's answer becomes today's mistake—with permission-aware search, private reasoning, and evidence you can open.

## Track

New Slack Agent

## Inspiration

Work rarely breaks because nobody documented a decision. It breaks because the decision changed three weeks later—and the old version still sounds just as confident in Slack.

A launch date moves in one channel. A security constraint appears in another. A month later, someone repeats the old answer and has no reason to suspect it is stale. Search can recover both messages, but it cannot tell the team whether they truly conflict or simply describe different environments, versions, customers, or time windows.

We built Contradiction Radar to catch that decision drift while there is still time to act, without pretending a model gets the final word.

## What it does

Contradiction Radar is the teammate who remembers what the team decided—and shows its receipts. In a direct message, a user asks it to check a current claim or the message they are viewing. The agent uses Slack's permission-aware Real-time Search API to retrieve earlier workspace evidence, then returns up to three explainable findings:

- Direct contradiction
- Requirement conflict
- Superseded decision
- Scope mismatch
- Time mismatch
- Needs clarification
- No contradiction

Each finding includes cautious language, confidence/severity, and Slack permalinks to both pieces of evidence. The user can add missing context, mark the issue resolved, or flag a false positive. Added context triggers a fresh classification, so the answer can change from “conflict” to “scope mismatch” when a version or environment becomes clear.

## How we built it

We deliberately split the problem in two: Slack decides what evidence the user is allowed to see; our self-hosted classifier decides whether that evidence actually conflicts.

Contradiction Radar uses the current Slack `agent_view` Messages experience, Bolt for JavaScript, TypeScript, Block Kit, and Socket Mode. A user DM provides the short-lived `action_token` required for bot-token calls to `assistant.search.context`, keeping retrieval tied to a user-initiated action and Slack's access boundary.

Search candidates are normalized and de-duplicated, then scored locally with a quantized `nli-deberta-v3-xsmall` ONNX model through Transformers.js. A deterministic policy layer checks negation, requirement language, topic overlap, environment, version, customer scope, time markers, proposal status, and explicit supersession. NLI is advisory: visible scope or time differences can override an apparent contradiction.

Results are rendered as threaded Block Kit evidence cards. A free-tier Linux VM runs the Socket Mode worker with automatic boot startup, process recovery, and a five-minute Slack health watchdog. The VM exposes no application port, and the quantized model remains self-hosted inside the same private runtime boundary.

## Challenges we ran into

The newest Slack Agent Messages experience landed just before the challenge deadline, so we migrated to `agent_view`, Slack CLI 4.4.0, and the current Web API SDK. We also discovered that Real-time Search needs the `action_token` from the message event itself plus a workspace-granted bot installation. Getting a search result was the easy part; proving that it respected the right user boundary took longer.

The hardest classification bug was not model accuracy. It was relevance. Adjacent search context can sound useful while saying nothing about the exact claim. We added topical gating plus explicit structured relations, then wrote regression cases for dates, environments, versions, proposals, and supersession.

Finally, we treated privacy as architecture instead of copy: no remote model inference, no raw Slack bodies in logs or feedback, DM-only findings, minimal scopes, bounded short-lived interactive state, and source permalinks rather than public reposting.

## Accomplishments that we're proud of

- Live permission-aware Slack RTS retrieval using the triggering user's `action_token`
- A genuinely useful context loop: production/version context reclassifies a high-confidence SSO conflict as a scope mismatch
- Explainable, permalink-backed findings with explicit human controls
- Local quantized NLI with a pinned model revision and deterministic failure fallback
- 28/28 automated tests and 28/28 exact labels on the declared fixed regression fixture
- Body-free operational logs and feedback, verified in the live sandbox
- A reproducible judge path, editable diagrams.net architecture, and a resilient free-tier Linux deployment that survives reboots without depending on a laptop

## What we learned

We started by trying to detect contradictions. We ended up building a system for refusing to overclaim.

Trustworthy contradiction detection is mostly about knowing when *not* to call something a contradiction. The best answer is often “these statements differ by version,” “this was only a proposal,” or “the later decision superseded the earlier one.” Slack's action-scoped search and evidence permalinks make that restraint visible and testable.

## What's next

Next we would add user-controlled channel/time filters, richer authority/status markers, duplicate-event persistence, and a workspace-specific evaluation workflow where teams can contribute reviewed examples without retaining raw message bodies. A managed version would preserve the same permission boundary and offer customer-controlled model storage.

## Built with

Slack Agent View, Slack Real-time Search API, Slack Bolt for JavaScript, Socket Mode, Block Kit, TypeScript, Node.js, Transformers.js, ONNX Runtime, DeBERTa NLI, Google Compute Engine, systemd, Vitest, diagrams.net, PowerShell

## Links

- Repository: https://github.com/ArabesE/contradiction-radar
- Slack sandbox/app DM: https://app.slack.com/client/E0BGST8FARF/D0BGXFRLE68
- Demo video: **HUMAN: paste final public video URL**

## Team

- Huilong Bian
- Wei Jiang

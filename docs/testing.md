# Testing and evaluation

## Reproduce the reported result

Run on Node.js 24 with runtime credentials configured in ignored `.env.local`:

```powershell
npm ci
npm run check
npm run evaluate
npm run health
```

On 2026-07-12 the submission build produced:

| Check | Result |
| --- | ---: |
| ESLint | Pass |
| TypeScript (`--noEmit`) | Pass |
| Automated tests | 28/28 pass |
| Build | Pass |
| Fixed evaluation pairs | 28 |
| Exact labels | 28/28 (100%) |
| Precision among predicted direct/requirement conflicts | 100% |
| Model fallback cases | 0 |
| Slack health | healthy; team match, search API, semantic search all true |

## Fixture design

`tests/fixtures/evaluation.json` is a frozen, hand-authored regression set with four examples in each behavior family:

- direct contradiction
- requirement conflict
- scope mismatch
- time mismatch
- superseded decision
- proposal versus decision
- no contradiction

It is evaluated as an ensemble: a local NLI score plus the same deterministic policy used at runtime. Exact-match accuracy tests the final user-facing label, not the NLI model in isolation.

## What the number does—and does not—mean

The fixture is intentionally small, balanced, and designed alongside the product. A 28/28 result shows that the implementation meets these declared regression cases. It must not be interpreted as 100% accuracy on arbitrary workspace language, an independent benchmark, or a guarantee.

Production safeguards therefore matter more than the headline score: cautious language, at most three findings, visible evidence links, scope/time overrides, an explicit no-contradiction outcome, and human feedback controls.

## Live integration checks

The Slack sandbox was tested end to end on 2026-07-12:

1. `app_home_opened` displays the Agent Messages experience and suggested prompts.
2. A DM message carries an `action_token` and triggers permission-aware RTS retrieval.
3. The Atlas claim returns a high-severity requirement conflict and a superseded-decision finding with Slack permalinks.
4. The SSO claim initially returns a requirement conflict; replying `This is for production version 2.` after **Add context** reclassifies the relevant evidence as a 90% scope mismatch.
5. **False positive** records an acknowledgement while the JSONL record contains no raw message text.
6. `npm run health` confirms the bot token targets the configured workspace and semantic search is enabled.

## Failure behavior

- Missing/invalid runtime credentials fail startup validation.
- Search failure returns an honest retry/health instruction; it does not fabricate evidence.
- Model initialization failure produces deterministic fallback scores and logs only an error category.
- Low topical overlap becomes `No contradiction` unless an explicit structured relation exists.
- Proposal language becomes `Needs clarification`, not a direct accusation.
- Malformed Slack markup is capped before regex normalization, and cache regression tests enforce TTL, capacity, eviction, and single-use retrieval.

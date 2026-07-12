# AGENTS.md

## Mission

Build Contradiction Radar for the Slack Agent Builder Challenge, New Slack Agent track. The authoritative product contract is `docs/product-spec.md`; architecture and security constraints are in `docs/architecture.md` and `docs/security-privacy.md`.

## Non-negotiable constraints

- Use Slack `agent_view`, Socket Mode, and the Real-Time Search API.
- Run contradiction inference locally; never require an OpenAI or paid model API.
- Treat every result as decision support. Prefer conservative labels and expose exact evidence with Slack permalinks.
- Never broaden a user's Slack access. Keep findings in the agent DM by default.
- Never commit Slack tokens, action tokens, cookies, raw message exports, or browser/session data.
- Do not persist Slack message bodies. Feedback storage contains identifiers, labels, and timestamps only.
- Do not log message text or secrets.
- Do not click the final Devpost Submit button.

## Working conventions

- TypeScript strict mode; Node.js 24 LTS.
- Pure domain logic belongs in `src/domain`; Slack adapters belong in `src/slack`; local inference belongs in `src/nli`.
- Add or update tests for every classification rule and failure mode.
- Run `npm run check` before every push.
- Use small English commits. Preserve editable diagram source and regenerate exports after changes.

## Human-only boundaries

Stop for login/passkey/2FA/CAPTCHA, UAC/security prompts, Slack credential creation or storage, payment prompts, destructive actions outside this repository, human voice/footage recording, and the final Devpost submission click.


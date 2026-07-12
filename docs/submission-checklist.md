# Submission checklist

## Code and Slack app

- [x] New eligible Slack agent created for the challenge
- [x] Current `features.agent_view` manifest
- [x] Socket Mode app installed at workspace level
- [x] Minimal declared OAuth scopes
- [x] Real-time Search capability and semantic search healthy
- [x] Triggering event `action_token` used for bot-token RTS calls
- [x] Six clearly labeled demo fixtures in `#general`
- [x] Atlas requirement-conflict and supersession flow verified
- [x] SSO Add-context → scope-mismatch flow verified
- [x] Feedback acknowledgement and body-free record verified
- [x] Per-user Windows logon task installed

## Quality and security

- [x] `npm run check`: lint, typecheck, tests, build
- [x] `npm run evaluate`: 28/28 fixed-fixture exact labels; 0 fallbacks
- [x] `npm run health`: healthy/team/search/semantic checks
- [x] `npm audit --omit=dev`: 0 vulnerabilities
- [x] License audit reviewed
- [x] Gitleaks reviewable working-tree and full-history scans clean
- [x] Repository security review closed all 33/33 worklist rows; two Low findings fixed with regression tests (sealed re-scan intentionally skipped for deadline)
- [x] Git history inspected for secrets or generated artifacts
- [ ] Repository made public only after all audits pass

## Submission assets

- [x] Public-ready README
- [x] Product, architecture, security, decision, and testing docs
- [x] Editable diagrams.net architecture source
- [x] Architecture SVG and high-resolution PNG
- [x] Judge testing instructions
- [x] Under-three-minute demo script
- [x] Recording guide and SRT subtitles
- [x] Devpost long-form copy
- [ ] Final English video recorded by human
- [ ] Video reviewed frame-by-frame for secrets
- [ ] Public/unlisted video URL pasted into Devpost

## Devpost

- [ ] Track set to **New Slack Agent**
- [ ] Team lists Huilong Bian and Wei Jiang
- [ ] Repository URL entered
- [ ] Slack sandbox/app URL entered
- [ ] Architecture diagram uploaded
- [ ] Story fields completed
- [ ] Technologies entered
- [ ] Draft saved and reviewed
- [ ] **HUMAN ONLY:** final video URL reviewed
- [ ] **HUMAN ONLY:** final Submit button clicked before 2026-07-13 20:00 EDT

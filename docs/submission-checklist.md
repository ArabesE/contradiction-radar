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
- [x] Cloud-only Slack RTS and ONNX response verified after stopping the Windows worker
- [x] Linux service starts at boot and restarts after failure
- [x] Five-minute Slack health watchdog active
- [x] Windows logon task retained but disabled as emergency fallback

## Quality and security

- [x] `npm run check`: lint, typecheck, 30/30 tests, build
- [x] `npm run evaluate`: 28/28 fixed-fixture exact labels; 0 fallbacks
- [x] `npm run health`: healthy/team/search/semantic checks
- [x] `npm audit --omit=dev`: 0 vulnerabilities
- [x] License audit reviewed
- [x] Gitleaks reviewable working-tree and full-history scans clean
- [x] Repository security review closed all 33/33 worklist rows; two Low findings fixed with regression tests (sealed re-scan intentionally skipped for deadline)
- [x] Git history inspected for secrets or generated artifacts
- [x] Repository made public only after all audits pass

## Submission assets

- [x] Public-ready README
- [x] Product, architecture, security, decision, and testing docs
- [x] Editable diagrams.net architecture source
- [x] Architecture SVG and high-resolution PNG
- [x] Judge testing instructions
- [x] Under-three-minute demo script
- [x] Recording guide and SRT subtitles
- [x] Recording materials updated for the cloud-only worker and simplified Slack findings
- [x] Devpost long-form copy
- [ ] Final English video recorded by human
- [ ] Video reviewed frame-by-frame for secrets
- [ ] Public/unlisted video URL pasted into Devpost

## Devpost

- [x] Track set to **New Slack Agent**
- [x] Team lists Huilong Bian and Wei Jiang
- [x] Repository URL entered
- [x] Slack sandbox/app URL entered
- [x] Architecture diagram uploaded
- [x] Story fields completed
- [x] Technologies entered
- [x] Draft saved and reviewed
- [ ] **HUMAN ONLY:** final video URL reviewed
- [ ] **HUMAN ONLY:** final Submit button clicked before 2026-07-13 20:00 EDT

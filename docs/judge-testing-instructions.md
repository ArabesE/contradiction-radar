# Judge testing instructions

## Fast path (about two minutes)

1. Open the supplied Slack developer sandbox and select **Contradiction Radar (local)** under **Agents & apps**.
2. In the Messages tab, send:

   `Check this claim: Project Atlas must launch on September 15.`

3. Expect a threaded response led by **Requirement conflict** with links to the current and earlier evidence. A separate **Superseded decision** card should identify the revised October 8 target.
4. Send:

   `Check this claim: SSO must be enabled for every account.`

5. On the top relevant card, select **Add context**, then reply:

   `This is for production version 2.`

6. Expect the production-v2 statement versus development-v1 evidence to be labeled **Scope mismatch**, demonstrating that context reduces overclaiming.
7. Select **False positive** or **Mark resolved** to see the human-control acknowledgement.

## Evidence in `#general`

Six bot-authored fixtures are explicitly prefixed `[DEMO DATA]`:

- September 15 final launch decision
- Cannot launch before October 1 because security approval is mandatory
- Production/version 2 requires SSO for every customer
- Local development/version 1 disables SSO for test accounts
- Three-step onboarding proposal, explicitly not final
- Revised October 8 decision that supersedes September 15

The agent deliberately accepts only bot-authored search results with the `[DEMO DATA]` prefix, preventing ordinary bot chatter from entering findings.

## Expected privacy behavior

- Findings remain in the agent DM.
- Each evidence item is a Slack permalink.
- Retrieval is initiated by the judge's DM action and uses that event's `action_token`.
- No raw message bodies are retained in logs or feedback.
- No remote LLM receives workspace content.

## Service availability

Judges do not need to deploy anything or connect to the application host. The submitted Slack sandbox routes events over Socket Mode to the continuously running cloud worker. It starts automatically at VM boot and a five-minute watchdog restarts it after a failed health check.

For operator verification:

```bash
systemctl is-active contradiction-radar.service
systemctl is-active contradiction-radar-watchdog.timer
sudo -u contradiction-radar bash -lc 'cd /opt/contradiction-radar && /usr/local/bin/node dist/scripts/health.js'
```

Healthy output reports `status: healthy`, `teamMatches: true`, `searchApiAvailable: true`, and `semanticSearchEnabled: true`.

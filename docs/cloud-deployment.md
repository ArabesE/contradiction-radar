# Free judging-period cloud deployment

Contradiction Radar can run on a small Linux VM while preserving the same Slack permission boundary and local-model architecture. The VM needs outbound HTTPS and WebSocket access only; Socket Mode does not require an inbound application port.

## Selected profile

- Google Cloud Free Trial or Free Tier
- Ubuntu 24.04 LTS, x86_64
- `e2-micro`, 30 GB standard persistent disk, `us-east1`
- No service account and no Google API scopes
- Node.js 24.18.0 verified against the official SHA-256 manifest
- Two GB swap for installation and model warm-up
- `systemd` restart policy plus a five-minute Slack health watchdog

The Google Cloud Free Trial states that it does not bill during its 90-day term. A valid payment method is still required for identity verification. Do not manually upgrade the billing account during the judging period. If an existing paid account is used instead, verify every resource against the current Free Tier limits and configure billing alerts before provisioning.

## Provisioning guardrails

Create exactly one non-preemptible `e2-micro` VM in `us-east1`, `us-central1`, or `us-west1`, with no GPU and no more than 30 GB of standard persistent disk. Do not create Cloud NAT, a load balancer, a database, a static IP, or managed AI services. Slack traffic is far below the included transfer allowance.

The VM must have outbound internet access to Slack and Hugging Face. SSH is the only administrative inbound path. Contradiction Radar itself does not listen on a network port.

## Secure installation

1. Clone the public repository to `/opt/contradiction-radar`.
2. Transfer `.env.local` directly over the authenticated SSH channel to a temporary path. Never paste or print its contents.
3. From the repository root, run:

   ```bash
   sudo bash scripts/install-linux-service.sh /tmp/contradiction-radar.env
   sudo rm -f /tmp/contradiction-radar.env
   ```

4. Verify without exposing credentials:

   ```bash
   sudo -u contradiction-radar bash -lc 'cd /opt/contradiction-radar && /usr/local/bin/node dist/scripts/health.js'
   systemctl is-active contradiction-radar.service
   systemctl is-active contradiction-radar-watchdog.timer
   ```

5. Send the declared Slack demo prompts and verify the evidence links and feedback controls before disabling the Windows fallback.

The installer stores the secret environment file as `/etc/contradiction-radar.env` with mode `0640`, creates an unprivileged service account, verifies the Node.js archive checksum, and enables automatic startup at boot. The watchdog restarts the service if workspace, RTS, or semantic-search health fails.

## Cutover and rollback

Slack supports multiple Socket Mode connections, so the cloud service can be validated while the Windows process is still online. After cloud validation, stop the Windows process and disable its logon task to keep a single production worker. If the cloud worker fails during the submission window, re-enable the Windows task as a temporary fallback.

Do not delete the cloud VM until judging ends on August 6, 2026 and the organizers no longer need sandbox access.

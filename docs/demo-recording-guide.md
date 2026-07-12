# Demo recording guide

## Required final human action

Record the English voice-over and Slack interaction, upload the final video publicly, paste its URL into Devpost, then review and click the final submission button. The final video must remain under three minutes; this script targets 2:35.

## Before recording

- Run `npm run restart` and `npm run health`.
- Set Slack zoom to 100% and Chrome to 1440×900 or higher.
- Close token/configuration tabs, terminals containing environment work, notifications, and unrelated DMs.
- Use the newest Atlas and SSO threads or create one clean take with the exact prompts in `demo-script.md`.
- Keep the `[DEMO DATA]` prefix visible when showing `#general`.
- Open `docs/architecture.png` before recording for the architecture segment.
- Do one silent rehearsal; confirm both evidence links and all three action buttons are visible.

## OBS recommendation

- Canvas/output: 1920×1080, 30 fps
- Encoder: hardware H.264 if available; otherwise x264
- Rate control: CQP 18–22 or 8–12 Mbps
- Audio: 48 kHz, mono/stereo AAC at 160 kbps
- Capture Chrome window only; disable cursor capture if it obscures labels
- Record MKV for crash safety, then remux to MP4 in OBS

## Editing

- Use hard cuts; no long intro animation.
- Add the subtitles from `demo-subtitles.srt` and adjust timestamps to the actual take.
- Never zoom/crop out Slack evidence links or the “Decision support, not a verdict” line.
- Blur any unexpected workspace content. Do not show `.env.local`, app token pages, terminal history, browser autofill, or Devpost login details.
- End on the product result, not a terminal.

## Final review

- Runtime under 3:00
- English narration or English captions
- Public/unlisted URL works in a private browsing window
- 1080p playback is available
- Repo URL and sandbox URL match Devpost
- No secrets or unrelated personal data appear frame by frame

import { WebClient } from '@slack/web-api';
import { readConfig } from '../src/config.js';

const confirmation = process.argv.find((arg) => arg.startsWith('--confirm='))?.split('=')[1] ?? process.env.DEMO_SEED_CONFIRM;
if (confirmation !== 'DEMO_ONLY') {
  console.error('Refusing to seed. Run only after a user-triggered request with --confirm=DEMO_ONLY.');
  process.exit(2);
}
const config = readConfig();
if (!config.SLACK_DEMO_CHANNEL_ID) throw new Error('SLACK_DEMO_CHANNEL_ID is required');
const client = new WebClient(config.SLACK_BOT_TOKEN);
const auth = await client.auth.test();
if (auth.team_id !== config.SLACK_TEAM_ID) {
  throw new Error('Refusing to seed: the configured bot token belongs to a different Slack workspace.');
}
const messages: Array<[string, string]> = [
  ['Maya — Demo Product', '[DEMO DATA] Decision: Project Atlas must launch on September 15. This is the final committed date.'],
  ['Noah — Demo Engineering', '[DEMO DATA] Requirement: Project Atlas cannot launch before October 1 because security review is mandatory.'],
  ['Maya — Demo Product', '[DEMO DATA] Production requires SSO for every customer account in version 2.'],
  ['Noah — Demo Engineering', '[DEMO DATA] In the local development environment, SSO is disabled for test accounts in version 1.'],
  ['Priya — Demo Design', '[DEMO DATA] Proposal: I prefer a three-step onboarding flow, but this is an option for discussion, not a final decision.'],
  ['Maya — Demo Product', '[DEMO DATA] Revised decision: the earlier September 15 launch decision is superseded. The current target is October 8 after security approval.'],
];
for (const [username, text] of messages) {
  await client.chat.postMessage({
    channel: config.SLACK_DEMO_CHANNEL_ID,
    username,
    text,
    icon_emoji: ':test_tube:',
  });
}
console.log(JSON.stringify({ seeded: messages.length, channel: config.SLACK_DEMO_CHANNEL_ID }));

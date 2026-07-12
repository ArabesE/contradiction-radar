import type { KnownBlock } from '@slack/types';
import type { Finding } from '../types.js';

export function evidenceBlocks(findings: Finding[]): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Contradiction Radar', emoji: true },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: 'Decision support, not a verdict. Results are limited to evidence Slack returned for this user-triggered check.' }],
    },
  ];
  if (findings.length === 0) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: '*No high-value earlier evidence found.* Try adding a project, version, environment, customer group, or time window.' } });
    return blocks;
  }
  findings.forEach((finding, index) => {
    const payload = Buffer.from(JSON.stringify({
      findingId: finding.id,
      previousMessageTs: finding.previous.messageTs,
      predictedLabel: finding.label,
      reasonCodes: finding.reasonCodes,
    })).toString('base64url');
    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${index + 1}. ${escape(finding.label)}* · ${finding.severity} · ${Math.round(finding.confidence * 100)}%\n${escape(finding.explanation)}`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Current*\n<${finding.current.permalink}|Open current evidence>` },
          { type: 'mrkdwn', text: `*Earlier*\n<${finding.previous.permalink}|Open earlier evidence>` },
        ],
      },
      {
        type: 'actions',
        block_id: `radar_actions_${finding.id}`,
        elements: [
          { type: 'button', action_id: 'radar_add_context', text: { type: 'plain_text', text: 'Add context' }, value: payload },
          { type: 'button', action_id: 'radar_resolved', text: { type: 'plain_text', text: 'Mark resolved' }, value: payload },
          { type: 'button', action_id: 'radar_false_positive', text: { type: 'plain_text', text: 'False positive' }, value: payload },
        ],
      },
    );
  });
  return blocks;
}

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


import { describe, expect, it } from 'vitest';
import { evidenceBlocks } from '../src/slack/blocks.js';
import type { Finding, RadarLabel } from '../src/types.js';

function finding(label: RadarLabel): Finding {
  return {
    id: label.toLowerCase().replaceAll(' ', '-'),
    label,
    severity: label === 'Requirement conflict' ? 'high' : 'low',
    confidence: 0.91,
    explanation: label === 'No contradiction' ? 'These messages are unrelated.' : 'These requirements cannot both be true.',
    current: { channelId: 'D1', messageTs: '1', permalink: 'https://example.com/current', text: 'Current claim' },
    previous: { channelId: 'C1', messageTs: '2', permalink: 'https://example.com/earlier', text: 'Earlier claim' },
    scores: { contradiction: 0.91, entailment: 0.04, neutral: 0.05, source: 'deterministic-fallback' },
    reasonCodes: [],
  };
}

describe('evidenceBlocks', () => {
  it('omits branding, disclaimer, and No contradiction candidates', () => {
    const blocks = evidenceBlocks([finding('No contradiction'), finding('Requirement conflict')]);
    const serialized = JSON.stringify(blocks);

    expect(serialized).not.toContain('Decision support, not a verdict');
    expect(serialized).not.toContain('Contradiction Radar');
    expect(serialized).not.toContain('No contradiction');
    expect(serialized).toContain('1. Requirement conflict');
  });

  it('returns a concise empty state when every candidate is non-conflicting', () => {
    const blocks = evidenceBlocks([finding('No contradiction')]);

    expect(blocks).toEqual([
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*No likely conflict found.* Try adding a project, version, environment, customer group, or time window.',
        },
      },
    ]);
  });
});

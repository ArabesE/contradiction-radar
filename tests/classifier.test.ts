import { describe, expect, it } from 'vitest';
import { classifyPair, rankFindings } from '../src/domain/classifier.js';
import type { Evidence, NliScores } from '../src/types.js';

const highContradiction: NliScores = { contradiction: 0.91, entailment: 0.03, neutral: 0.06, source: 'local-model' };
const neutral: NliScores = { contradiction: 0.08, entailment: 0.12, neutral: 0.8, source: 'local-model' };

function evidence(text: string, ts: string): Evidence {
  return { channelId: 'C1', messageTs: ts, permalink: `https://example.slack.com/archives/C1/p${ts.replace('.', '')}`, text };
}

describe('conservative classification policy', () => {
  it('detects an incompatible requirement', () => {
    const finding = classifyPair(evidence('The launch must not happen before October.', '2.0'), evidence('The launch must happen in September.', '1.0'), highContradiction);
    expect(finding.label).toBe('Requirement conflict');
    expect(finding.severity).toBe('high');
  });

  it('downgrades different environments to scope mismatch', () => {
    const finding = classifyPair(evidence('Development does not require SSO.', '2.0'), evidence('Production requires SSO.', '1.0'), highContradiction);
    expect(finding.label).toBe('Scope mismatch');
    expect(finding.reasonCodes).toContain('environment-mismatch');
  });

  it('downgrades different time windows', () => {
    const finding = classifyPair(evidence('The service is writable tomorrow.', '2.0'), evidence('The service is read-only today.', '1.0'), highContradiction);
    expect(finding.label).toBe('Time mismatch');
  });

  it('does not treat a proposal as a final contradiction', () => {
    const finding = classifyPair(evidence('The approved flow has five steps.', '2.0'), evidence('I prefer a three-step flow.', '1.0'), highContradiction);
    expect(finding.label).toBe('Needs clarification');
  });

  it('recognizes explicit supersession before raw NLI', () => {
    const finding = classifyPair(evidence('Revised decision: the old date is superseded by October 8.', '2.0'), evidence('The deadline was September 15.', '1.0'), highContradiction);
    expect(finding.label).toBe('Superseded decision');
  });

  it('returns no contradiction for neutral evidence', () => {
    const finding = classifyPair(evidence('The web client supports keyboard shortcuts.', '2.0'), evidence('The API uses OAuth.', '1.0'), neutral);
    expect(finding.label).toBe('No contradiction');
  });

  it('limits and prioritizes high-value findings', () => {
    const a = classifyPair(evidence('The launch must not happen.', '2.0'), evidence('The launch must happen.', '1.0'), highContradiction);
    const b = classifyPair(evidence('Development disables SSO.', '4.0'), evidence('Production enables SSO.', '3.0'), highContradiction);
    const c = classifyPair(evidence('Unrelated note.', '6.0'), evidence('Other topic.', '5.0'), neutral);
    expect(rankFindings([c, b, a], 2).map((item) => item.label)).toEqual(['Requirement conflict', 'Scope mismatch']);
  });
});


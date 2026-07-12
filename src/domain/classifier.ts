import { createHash } from 'node:crypto';
import { extractMarkers } from './preprocess.js';
import type { Evidence, Finding, NliScores, RadarLabel, Severity } from '../types.js';

export function classifyPair(current: Evidence, previous: Evidence, scores: NliScores): Finding {
  const now = extractMarkers(current.text);
  const before = extractMarkers(previous.text);
  const reasons: string[] = [];
  let label: RadarLabel = 'Needs clarification';
  let explanation = 'The messages are related, but the available evidence is not strong enough to call this a contradiction.';

  const environmentMismatch = disjoint(now.environments, before.environments);
  const versionMismatch = disjoint(now.versions, before.versions);
  const timeMismatch = disjoint(now.timeMarkers, before.timeMarkers);
  const scopeMismatch = disjoint(now.scopes, before.scopes);

  if (now.isSuperseding || before.isSuperseding) {
    label = 'Superseded decision';
    explanation = 'One message explicitly says an earlier decision was replaced, revised, resolved, or is no longer current.';
    reasons.push('supersession-language');
  } else if (environmentMismatch || versionMismatch || scopeMismatch) {
    label = 'Scope mismatch';
    const dimensions = [environmentMismatch && 'environment', versionMismatch && 'version', scopeMismatch && 'audience or scope'].filter(Boolean).join(', ');
    explanation = `The statements differ by ${dimensions}; they may both be valid within their own scope.`;
    reasons.push(environmentMismatch ? 'environment-mismatch' : '', versionMismatch ? 'version-mismatch' : '', scopeMismatch ? 'scope-mismatch' : '');
  } else if (timeMismatch) {
    label = 'Time mismatch';
    explanation = 'The statements refer to different time windows, so the apparent conflict may reflect a change over time.';
    reasons.push('time-mismatch');
  } else if (now.isProposal || before.isProposal) {
    label = 'Needs clarification';
    explanation = 'At least one statement is framed as a proposal, preference, option, or draft rather than a final decision.';
    reasons.push('proposal-versus-decision');
  } else if (scores.entailment >= 0.64 && scores.entailment > scores.contradiction) {
    label = 'No contradiction';
    explanation = 'The earlier message appears consistent with or supportive of the current statement.';
    reasons.push('nli-entailment');
  } else if (scores.contradiction >= 0.78 && Math.abs(scores.contradiction - scores.entailment) >= 0.35) {
    label = now.isRequirement || before.isRequirement ? 'Requirement conflict' : 'Direct contradiction';
    explanation = label === 'Requirement conflict'
      ? 'The messages impose incompatible requirements or commitments under the same visible conditions.'
      : 'The statements make opposing claims under the same visible conditions.';
    reasons.push('high-contradiction-score', now.hasNegation !== before.hasNegation ? 'opposing-polarity' : '');
  } else if (scores.neutral >= 0.68 || scores.contradiction < 0.55) {
    label = 'No contradiction';
    explanation = 'The messages discuss related material without an explicit incompatible claim.';
    reasons.push('neutral-or-low-contradiction');
  } else {
    reasons.push('low-margin');
  }

  const confidence = calibratedConfidence(label, scores, reasons);
  return {
    id: createHash('sha256').update(`${current.channelId}:${current.messageTs}:${previous.channelId}:${previous.messageTs}`).digest('hex').slice(0, 16),
    label,
    severity: severityFor(label, confidence),
    confidence,
    explanation,
    current,
    previous,
    scores,
    reasonCodes: reasons.filter(Boolean),
  };
}

export function rankFindings(findings: Finding[], limit = 3): Finding[] {
  const rank: Record<RadarLabel, number> = {
    'Requirement conflict': 7,
    'Direct contradiction': 6,
    'Superseded decision': 5,
    'Scope mismatch': 4,
    'Time mismatch': 3,
    'Needs clarification': 2,
    'No contradiction': 1,
  };
  return [...findings]
    .sort((a, b) => rank[b.label] - rank[a.label] || b.confidence - a.confidence)
    .slice(0, limit);
}

function disjoint(a: string[], b: string[]): boolean {
  return a.length > 0 && b.length > 0 && !a.some((item) => b.includes(item));
}

function calibratedConfidence(label: RadarLabel, scores: NliScores, reasons: string[]): number {
  if (label === 'Scope mismatch' || label === 'Time mismatch' || label === 'Superseded decision') return reasons.length > 0 ? 0.9 : 0.7;
  if (label === 'Direct contradiction' || label === 'Requirement conflict') return round(Math.min(0.97, scores.contradiction));
  if (label === 'No contradiction') return round(Math.max(scores.entailment, scores.neutral));
  return round(Math.max(0.5, 1 - Math.abs(scores.contradiction - scores.entailment)));
}

function severityFor(label: RadarLabel, confidence: number): Severity {
  if ((label === 'Direct contradiction' || label === 'Requirement conflict') && confidence >= 0.85) return 'high';
  if (label === 'No contradiction') return 'low';
  return 'medium';
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}


import { describe, expect, it } from 'vitest';
import { extractClaim, extractMarkers, MAX_NORMALIZE_CHARS, normalizeText } from '../src/domain/preprocess.js';

describe('preprocessing', () => {
  it('extracts a claim from a user instruction', () => {
    expect(extractClaim('Check this claim: Production must require SSO for every customer.')).toBe('Production must require SSO for every customer.');
  });

  it('asks for clarification on an underspecified check', () => {
    expect(extractClaim('check this')).toBeNull();
  });

  it('normalizes Slack links and whitespace', () => {
    expect(normalizeText('See <https://example.com|source>   now')).toBe('See now');
  });

  it('bounds malformed Slack markup before normalization', () => {
    const unit = '<https://aaaaaaaa';
    const malformed = unit.repeat(Math.ceil(40_000 / unit.length)).slice(0, 40_000);
    expect(normalizeText(malformed).length).toBeLessThanOrEqual(MAX_NORMALIZE_CHARS);
    expect(extractClaim(malformed)?.length).toBeLessThanOrEqual(700);
    expect(() => extractMarkers(malformed)).not.toThrow();
  });

  it.each([MAX_NORMALIZE_CHARS - 1, MAX_NORMALIZE_CHARS, MAX_NORMALIZE_CHARS + 1])('enforces the normalization boundary at %i characters', (length) => {
    expect(normalizeText('a'.repeat(length)).length).toBe(Math.min(length, MAX_NORMALIZE_CHARS));
  });

  it('detects context and decision status markers', () => {
    const markers = extractMarkers('Proposal: in staging version 2, enterprise customers might use SSO next week.');
    expect(markers.environments).toContain('staging');
    expect(markers.versions).toContain('v2');
    expect(markers.scopes).toContain('enterprise');
    expect(markers.isProposal).toBe(true);
  });

  it('does not mistake dates or quantities for software versions', () => {
    const markers = extractMarkers('The launch moves from September 15 to October 1, 2026.');
    expect(markers.versions).toEqual([]);
    expect(markers.timeMarkers).toContain('2026');
  });
});

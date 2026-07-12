import { describe, expect, it } from 'vitest';
import { extractClaim, extractMarkers, normalizeText } from '../src/domain/preprocess.js';

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

  it('detects context and decision status markers', () => {
    const markers = extractMarkers('Proposal: in staging version 2, enterprise customers might use SSO next week.');
    expect(markers.environments).toContain('staging');
    expect(markers.versions).toContain('v2');
    expect(markers.scopes).toContain('enterprise');
    expect(markers.isProposal).toBe(true);
  });
});


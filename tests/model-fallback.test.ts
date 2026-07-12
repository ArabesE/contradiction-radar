import { describe, expect, it } from 'vitest';
import { fallbackScores } from '../src/nli/model.js';

describe('deterministic NLI fallback', () => {
  it('detects opposing polarity with shared subject terms', () => {
    const scores = fallbackScores('The export includes deleted records.', 'The export does not include deleted records.');
    expect(scores.source).toBe('deterministic-fallback');
    expect(scores.contradiction).toBeGreaterThan(scores.neutral);
  });

  it('stays neutral for unrelated statements', () => {
    const scores = fallbackScores('The API uses OAuth.', 'The mobile client has offline drafts.');
    expect(scores.neutral).toBeGreaterThan(0.7);
  });
});


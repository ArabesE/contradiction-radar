import { describe, expect, it } from 'vitest';
import { keywordQuery } from '../src/slack/search.js';

describe('keyword query generation', () => {
  it('deduplicates useful words and uses OR alternatives', () => {
    expect(keywordQuery('Project Atlas launch launch deadline September')).toBe('project OR atlas OR launch OR deadline OR september');
  });
});


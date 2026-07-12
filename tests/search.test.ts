import { describe, expect, it } from 'vitest';
import { keywordQuery, permalinkForContext } from '../src/slack/search.js';

describe('keyword query generation', () => {
  it('deduplicates useful words and uses OR alternatives', () => {
    expect(keywordQuery('Project Atlas launch launch deadline September')).toBe('project OR atlas OR launch OR deadline OR september');
  });

  it('preserves short uppercase acronyms', () => {
    expect(keywordQuery('SSO must be enabled for every account')).toContain('sso');
  });

  it('creates a Slack permalink for context messages', () => {
    expect(permalinkForContext('https://example.slack.com/archives/C1/p1000001', 'C1', '123.456')).toBe('https://example.slack.com/archives/C1/p123456');
  });
});

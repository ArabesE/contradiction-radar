import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Fixture { id: string; category: string; previous: string; current: string; expected: string }

describe('evaluation fixture', () => {
  const fixtures = JSON.parse(readFileSync(new URL('./fixtures/evaluation.json', import.meta.url), 'utf8')) as Fixture[];
  it('contains at least 24 labeled pairs and all required categories', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(24);
    const categories = new Set(fixtures.map((item) => item.category));
    for (const required of ['direct contradiction', 'requirement conflict', 'supersession', 'scope mismatch', 'time mismatch', 'proposal versus decision', 'no contradiction']) {
      expect(categories.has(required)).toBe(true);
    }
  });

  it('uses unique fixture ids', () => {
    expect(new Set(fixtures.map((item) => item.id)).size).toBe(fixtures.length);
  });
});


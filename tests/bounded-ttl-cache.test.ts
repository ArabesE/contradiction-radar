import { describe, expect, it } from 'vitest';
import { BoundedTtlCache } from '../src/domain/bounded-ttl-cache.js';

describe('BoundedTtlCache', () => {
  it('evicts the oldest entry at the hard capacity', () => {
    let now = 0;
    const cache = new BoundedTtlCache<string, string>({ maxEntries: 2, ttlMs: 100, now: () => now });
    cache.set('a', 'body-a');
    now += 1;
    cache.set('b', 'body-b');
    now += 1;
    cache.set('c', 'body-c');
    expect(cache.size).toBe(2);
    expect(cache.take('a')).toBeUndefined();
    expect(cache.take('b')).toBe('body-b');
  });

  it('expires entries and releases them during a sweep', () => {
    let now = 0;
    const cache = new BoundedTtlCache<string, { text: string }>({ maxEntries: 5, ttlMs: 10, now: () => now });
    cache.set('finding', { text: 'sensitive synthetic body' });
    now = 11;
    expect(cache.sweep()).toBe(1);
    expect(cache.size).toBe(0);
    expect(cache.take('finding')).toBeUndefined();
  });

  it('makes retrieval single-use and refreshes duplicate keys without growing', () => {
    let now = 0;
    const cache = new BoundedTtlCache<string, number>({ maxEntries: 5, ttlMs: 10, now: () => now });
    cache.set('finding', 1);
    now = 5;
    cache.set('finding', 2);
    expect(cache.size).toBe(1);
    now = 12;
    expect(cache.take('finding')).toBe(2);
    expect(cache.take('finding')).toBeUndefined();
  });

  it('stays bounded across thousands of unique keys', () => {
    const cache = new BoundedTtlCache<string, string>({ maxEntries: 500, ttlMs: 60_000 });
    for (let index = 0; index < 20_000; index += 1) cache.set(`finding-${index}`, `body-${index}`);
    expect(cache.size).toBe(500);
    expect(cache.take('finding-0')).toBeUndefined();
    expect(cache.take('finding-19999')).toBe('body-19999');
  });
});

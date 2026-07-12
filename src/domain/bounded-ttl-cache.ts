export interface CacheOptions {
  maxEntries: number;
  ttlMs: number;
  now?: () => number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class BoundedTtlCache<K, V> {
  readonly #entries = new Map<K, CacheEntry<V>>();
  readonly #maxEntries: number;
  readonly #ttlMs: number;
  readonly #now: () => number;

  constructor(options: CacheOptions) {
    if (!Number.isInteger(options.maxEntries) || options.maxEntries < 1) throw new Error('maxEntries must be a positive integer');
    if (!Number.isFinite(options.ttlMs) || options.ttlMs < 1) throw new Error('ttlMs must be positive');
    this.#maxEntries = options.maxEntries;
    this.#ttlMs = options.ttlMs;
    this.#now = options.now ?? Date.now;
  }

  get size(): number {
    this.sweep();
    return this.#entries.size;
  }

  set(key: K, value: V): void {
    const now = this.#now();
    this.sweep(now);
    this.#entries.delete(key);
    while (this.#entries.size >= this.#maxEntries) {
      const oldest = this.#entries.keys().next().value;
      if (oldest === undefined) break;
      this.#entries.delete(oldest);
    }
    this.#entries.set(key, { value, expiresAt: now + this.#ttlMs });
  }

  take(key: K): V | undefined {
    const entry = this.#entries.get(key);
    this.#entries.delete(key);
    if (!entry || entry.expiresAt <= this.#now()) return undefined;
    return entry.value;
  }

  sweep(now = this.#now()): number {
    let removed = 0;
    for (const [key, entry] of this.#entries) {
      if (entry.expiresAt > now) continue;
      this.#entries.delete(key);
      removed += 1;
    }
    return removed;
  }
}

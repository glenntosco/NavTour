/**
 * SimpleCache — mirrors Navattic's TTL-based cache
 */

const EXPIRED = Symbol('expired');

interface CacheEntry<T> {
  value: T;
  createdAt: number;
}

function wrap<T>(value: T): CacheEntry<T> {
  return { value, createdAt: Date.now() };
}

function unwrap<T>(entry: CacheEntry<T>, maxAge: number): T | typeof EXPIRED {
  return Date.now() - entry.createdAt > maxAge ? EXPIRED : entry.value;
}

export class SimpleCache<K = string, V = any> {
  private cache = new Map<K, CacheEntry<V>>();
  private maxAge: number;

  constructor(opts: { maxAge?: number } = {}) {
    this.maxAge = (opts.maxAge ?? 0) * 1000;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    const result = unwrap(entry, this.maxAge);
    if (result === EXPIRED) {
      this.delete(key);
      return undefined;
    }
    return result;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  set(key: K, value: V): this {
    if (this.maxAge <= 0) return this;
    this.cache.set(key, wrap(value));
    return this;
  }

  get size(): number {
    return this.cache.size;
  }

  *entries(): IterableIterator<[K, V]> {
    for (const [k, entry] of this.cache.entries()) {
      const v = unwrap(entry, this.maxAge);
      if (v !== EXPIRED) {
        yield [k, v as V];
      } else {
        this.delete(k);
      }
    }
  }

  *keys(): IterableIterator<K> {
    for (const [k] of this.entries()) yield k;
  }

  *values(): IterableIterator<V> {
    for (const [, v] of this.entries()) yield v;
  }
}

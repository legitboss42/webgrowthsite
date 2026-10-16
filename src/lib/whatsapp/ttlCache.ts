type CacheEntry<Value> = { value: Value; expiresAt: number };

type WhatsAppTtlCacheOptions = {
  ttlMs: number;
  now?: () => number;
};

export function createWhatsAppTtlCache<Key, Value>(options: WhatsAppTtlCacheOptions) {
  const values = new Map<Key, CacheEntry<Value>>();
  const inFlight = new Map<Key, Promise<Value>>();
  const now = options.now || Date.now;
  const ttlMs = Math.max(1, options.ttlMs);

  return {
    async get(key: Key, loader: () => Promise<Value>): Promise<Value> {
      const cached = values.get(key);
      if (cached && cached.expiresAt > now()) return cached.value;

      const pending = inFlight.get(key);
      if (pending) return pending;

      const load = loader()
        .then((value) => {
          values.set(key, { value, expiresAt: now() + ttlMs });
          return value;
        })
        .finally(() => {
          inFlight.delete(key);
        });
      inFlight.set(key, load);
      return load;
    },
    delete(key: Key) {
      values.delete(key);
      inFlight.delete(key);
    },
    clear() {
      values.clear();
      inFlight.clear();
    },
  };
}

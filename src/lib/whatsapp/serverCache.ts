type CacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
  pending: boolean;
};

type CacheOptions = {
  now?: () => number;
};

export function createWhatsAppServerCache(options: CacheOptions = {}) {
  const now = options.now || Date.now;
  const entries = new Map<string, CacheEntry<unknown>>();

  function get<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const current = entries.get(key) as CacheEntry<T> | undefined;
    if (current && (current.pending || current.expiresAt > now())) return current.promise;

    const entry: CacheEntry<T> = {
      expiresAt: now() + Math.max(0, ttlMs),
      promise: Promise.resolve(undefined as T),
      pending: true,
    };
    const promise = loader()
      .then((value) => {
        const active = entries.get(key) as CacheEntry<T> | undefined;
        if (active === entry) active.pending = false;
        return value;
      })
      .catch((error) => {
        const active = entries.get(key);
        if (active === entry) entries.delete(key);
        throw error;
      });
    entry.promise = promise;
    entries.set(key, entry as CacheEntry<unknown>);
    return promise;
  }

  function invalidate(prefix?: string) {
    if (!prefix) {
      entries.clear();
      return;
    }
    for (const key of entries.keys()) {
      if (key.startsWith(prefix)) entries.delete(key);
    }
  }

  function has(key: string) {
    const current = entries.get(key);
    return Boolean(current && (current.pending || current.expiresAt > now()));
  }

  return { get, invalidate, has };
}

export const whatsappServerCache = createWhatsAppServerCache();

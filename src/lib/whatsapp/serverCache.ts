type CacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

type CacheOptions = {
  now?: () => number;
};

export function createWhatsAppServerCache(options: CacheOptions = {}) {
  const now = options.now || Date.now;
  const entries = new Map<string, CacheEntry<unknown>>();

  function get<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const current = entries.get(key) as CacheEntry<T> | undefined;
    if (current && current.expiresAt > now()) return current.promise;

    const promise = loader().catch((error) => {
      const active = entries.get(key);
      if (active?.promise === promise) entries.delete(key);
      throw error;
    });
    entries.set(key, {
      expiresAt: now() + Math.max(0, ttlMs),
      promise,
    });
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
    return Boolean(current && current.expiresAt > now());
  }

  return { get, invalidate, has };
}

export const whatsappServerCache = createWhatsAppServerCache();

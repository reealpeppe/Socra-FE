// Browser-memory only. Never share private responses between server requests,
// sessions or tabs, and never persist payloads in localStorage.
type Entry = { value?: unknown; expires: number; promise?: Promise<unknown> };
const entries = new Map<string, Entry>();
let version = 0;
let sessionVersion = 0;
export function clearRequestCache(sessionChanged = false) {
  entries.clear();
  version += 1;
  if (sessionChanged) sessionVersion += 1;
}
export function peekRequestCache<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  const entry = entries.get(key);
  return entry && entry.expires > Date.now() ? (entry.value as T) : undefined;
}
export async function cachedRequest<T>(
  key: string,
  ttl: number,
  load: () => Promise<T>,
): Promise<T> {
  if (typeof window === "undefined") return load();
  const current = entries.get(key);
  if (current?.promise) return current.promise as Promise<T>;
  if (current && current.expires > Date.now()) return current.value as T;
  if (entries.size > 100) entries.clear();
  const requestVersion = version;
  const requestSession = sessionVersion;
  const entry: Entry = { expires: 0 };
  entry.promise = load()
    .then((value) => {
      if (requestSession !== sessionVersion)
        throw new Error("La sessione è cambiata. Ricarica la pagina.");
      if (version === requestVersion && entries.get(key) === entry) {
        entry.value = value;
        entry.expires = Date.now() + ttl;
      }
      return value;
    })
    .finally(() => {
      entry.promise = undefined;
      if (entries.get(key) === entry && entry.expires <= Date.now())
        entries.delete(key);
    });
  entries.set(key, entry);
  return entry.promise as Promise<T>;
}

// ─── API Client ─────────────────────────────────────────────────────────────────
// Centralised fetch utility used by the form engine for all API calls.
// Features: TTL-based in-memory cache, request deduplication, AbortSignal support.

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface FetchOptions {
  signal?: AbortSignal;
  /**
   * How long (ms) the cached response stays valid.
   * Pass `0` to skip the cache entirely. Defaults to 5 minutes.
   */
  cacheTtl?: number;
}

/**
 * Fetches JSON from a URL with:
 * - In-memory response cache (TTL-based, default 5 min)
 * - Automatic request deduplication — parallel calls to the same URL share one fetch
 * - AbortSignal support — aborted calls throw a DOMException with name "AbortError"
 */
export async function fetchJson<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const { signal, cacheTtl = DEFAULT_CACHE_TTL_MS } = options;

  if (cacheTtl > 0) {
    const cached = responseCache.get(url);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as T;
    }
  }

  const existing = inflightRequests.get(url);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetch(url, { signal })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      return res.json() as Promise<T>;
    })
    .then((data) => {
      if (cacheTtl > 0) {
        responseCache.set(url, { data, expiresAt: Date.now() + cacheTtl });
      }
      inflightRequests.delete(url);
      return data;
    })
    .catch((err: unknown) => {
      inflightRequests.delete(url);
      throw err;
    });

  inflightRequests.set(url, promise);
  return promise as Promise<T>;
}

/**
 * Replaces `{fieldId}` placeholders in a URL template with the corresponding
 * values from the provided form state map. Unknown keys become empty strings.
 *
 * @example
 * interpolateUrl("/api/location/cities?state={state}", { state: "CA" })
 * // → "/api/location/cities?state=CA"
 */
export function interpolateUrl(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(String(values[key] ?? "")));
}

/** Clears the in-memory response cache. Useful in tests or after server-side mutations. */
export function clearApiCache(): void {
  responseCache.clear();
}

export interface PostOptions {
  signal?: AbortSignal;
  /** Extra headers merged with the default `Content-Type: application/json`. */
  headers?: Record<string, string>;
}

/**
 * Posts JSON data to a URL and returns the parsed response.
 * - Merges caller-supplied headers with the required `Content-Type` header.
 * - AbortSignal support — aborted calls throw a DOMException with name "AbortError".
 *
 * @example
 * postJson("/api/form/submit", payload)
 * postJson("/api/form/submit", payload, { headers: { Authorization: "Bearer token" } })
 */
export async function postJson<TResponse = unknown, TBody = unknown>(
  url: string,
  data: TBody,
  options: PostOptions = {},
): Promise<TResponse> {
  const { signal, headers } = options;

  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<TResponse>;
}

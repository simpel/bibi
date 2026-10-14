import type { AccessToken } from "./exchange-code";

/** Re-mint this long before expiry so a token never expires mid-run (15 min tokens). */
const EXPIRY_SKEW_MS = 2 * 60 * 1000;
const MAX_ENTRIES = 1000;

const cache = new Map<string, AccessToken>();

export type TokenCacheKeyInput = { client: string; userId: string; organizationId: string };

/** Key from the registry client + the *verified* caller (never from client input). */
export function tokenCacheKey({ client, userId, organizationId }: TokenCacheKeyInput): string {
  return [client, userId, organizationId].join("\u0000");
}

export type ReadCachedTokenInput = { key: string; now?: number };

export function readCachedToken({ key, now = Date.now() }: ReadCachedTokenInput): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt - EXPIRY_SKEW_MS > now) return entry.accessToken;
  cache.delete(key);
  return null;
}

export type StoreTokenInput = { key: string; token: AccessToken };

/** Bounded per-process cache; evicts the oldest entry when full. */
export function storeToken({ key, token }: StoreTokenInput): void {
  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, token);
}

/** Tests only. */
export function clearTokenCache(): void {
  cache.clear();
}

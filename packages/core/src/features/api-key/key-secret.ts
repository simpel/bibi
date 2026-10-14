import { createHash, randomInt } from "node:crypto";
import { API_KEY_PREFIX } from "./schema";

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const KEY_LENGTH = 64;
/** Characters of the key kept in plain text (`start`), as the Better Auth plugin does. */
const START_LENGTH = 6;

export type KeySecret = { key: string; hash: string; start: string };

export type HashApiKeyInput = { key: string };

/**
 * SHA-256, base64url without padding: the Better Auth API key plugin's `defaultKeyHasher`, so
 * `verifyApiKey` finds keys issued here. `packages/auth` tests guard the equivalence.
 */
export function hashApiKey({ key }: HashApiKeyInput): string {
  return createHash("sha256").update(key).digest("base64url");
}

/** A new random key (`okz_` + 64 letters, like the plugin's generator) and what is stored. */
export function generateApiKey(): KeySecret {
  const body = Array.from({ length: KEY_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]);
  const key = `${API_KEY_PREFIX}${body.join("")}`;
  return { key, hash: hashApiKey({ key }), start: key.slice(0, START_LENGTH) };
}

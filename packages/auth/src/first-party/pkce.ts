import { createHash, randomBytes } from "node:crypto";

export type PkcePair = { verifier: string; challenge: string };

/** RFC 7636 S256 pair; a fresh one per token mint. */
export function createPkcePair(): PkcePair {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

const consumed = new Map<string, number>();

export type ConsumeInput = { jti: string; exp: number; now?: number };

/**
 * Single use per process: returns false when the token id was already used. Entries expire with
 * the token. Multi-instance deployments need a shared store for strict single use (see CLAUDE.md).
 */
export function consumeApproval({
  jti,
  exp,
  now = Math.floor(Date.now() / 1000),
}: ConsumeInput): boolean {
  for (const [id, expiry] of consumed) if (expiry <= now) consumed.delete(id);
  if (consumed.has(jti)) return false;
  consumed.set(jti, exp);
  return true;
}

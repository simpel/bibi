import type { Db } from "../client";

const HOUR = 3_600_000;

export type CreatePurgerInput = { client: () => Db; retentionDays: number };

/** Deletes rows older than the retention, at most once per hour (called after each flush). */
export function createPurger({ client, retentionDays }: CreatePurgerInput): () => Promise<void> {
  let lastPurge = 0;
  return async () => {
    if (Date.now() - lastPurge < HOUR) return;
    lastPurge = Date.now();
    const cutoff = new Date(Date.now() - retentionDays * 24 * HOUR);
    await client().systemLog.deleteMany({ where: { time: { lt: cutoff } } });
  };
}

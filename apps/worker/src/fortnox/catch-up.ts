import {
  FORTNOX_REPLAY_MS,
  fortnoxStreamSecret,
  loadFortnoxOffsets,
  sweepFortnoxInvoices,
} from "@bibi/core";
import type { Db } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { forEachOrganization } from "../for-each-organization";

/**
 * On start (ADR 0090): when the stream has been away longer than Fortnox replays, or has never
 * run, re-reads every invoice raised in Fortnox once. Otherwise the stream's replay covers it.
 */
export async function catchUpFortnox({ db }: { db: Db }): Promise<void> {
  if (!fortnoxStreamSecret()) return;
  const offsets = await loadFortnoxOffsets({ db });
  const last = Math.max(0, ...offsets.map((row) => row.updatedAt.getTime()));
  if (Date.now() - last < FORTNOX_REPLAY_MS) return;
  const { succeeded, failed } = await forEachOrganization({
    db,
    run: ({ context }) => sweepFortnoxInvoices({ context }),
  });
  getLogger().info({ event: "fortnox.catchUpRun", succeeded, failed });
}

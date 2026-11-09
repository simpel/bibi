import { type Db, getDb } from "@bibi/db";
import { ok, type Result } from "../../../errors/result";
import { type SweepOutcome, sweepProviderInvoices } from "../../sweep-invoices";
import { FORTNOX_REPLAY_MS, fortnoxStreamSecret } from "./replay";
import { loadFortnoxOffsets } from "./tenants";

/**
 * On the worker's start (ADR 0090): when the stream has been away longer than Fortnox replays,
 * or has never run, re-reads every invoice raised in Fortnox once. Otherwise the replay covers it.
 */
export async function catchUpFortnox({
  db = getDb(),
}: {
  db?: Db;
} = {}): Promise<Result<SweepOutcome>> {
  const none = ok({ value: { organizations: 0, synced: 0 } });
  if (!fortnoxStreamSecret()) return none;
  const offsets = await loadFortnoxOffsets({ db });
  const last = Math.max(0, ...offsets.map((row) => row.updatedAt.getTime()));
  if (Date.now() - last < FORTNOX_REPLAY_MS) return none;
  return sweepProviderInvoices({ provider: "FORTNOX", db });
}

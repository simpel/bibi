import type { Prisma, ProviderConnection } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { authFor } from "../../providers/connections";
import { findProvider } from "../../providers/registry";
import type { ProviderAccount } from "../../providers/types";
import { nowOf } from "../../time/now";
import { chartEntryOf } from "./chart";

export type RunSyncInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "now">;
  row: ProviderConnection;
};

/** Mappings a new connection starts with when the BAS accounts (or a Spiris family on them) exist (ADR 0123). */
const BAS_DEFAULTS = [
  { purpose: "ADVANCES", account: "2420" },
  { purpose: "REVENUE_DEFAULT", account: "3001" },
] as const;

type SuggestInput = RunSyncInput & { accounts: readonly ProviderAccount[] };

/**
 * A connection with no mapping yet gets Deposits on 2420 and Default revenue on 3001 when the
 * system has those accounts active (Spiris: the coding family that books to them), so a plain
 * BAS chart works at once. Never overwrites.
 */
async function suggestBasMappings({ context, row, accounts }: SuggestInput) {
  if (!findProvider({ key: row.provider })?.ledger) return;
  if ((await context.db.accountMapping.count({ where: { connectionId: row.id } })) > 0) return;
  for (const { purpose, account } of BAS_DEFAULTS) {
    const found = chartEntryOf({
      chart: { readable: true, accounts: [...accounts] },
      ref: account,
    });
    if (!found?.active) continue;
    await context.db.accountMapping.create({
      data: {
        organizationId: context.organizationId,
        connectionId: row.id,
        purpose,
        entityTypeId: null,
        providerAccount: found.account,
      },
    });
  }
}

/**
 * Reads the accounting system's accounts and stores them on the connection as a snapshot (ADR
 * 0123). A provider with nothing to map is returned as it is; an account list the system refuses
 * to give (FORBIDDEN: a Fortnox token without the bookkeeping scope) is stored as unreadable so
 * the page can say reconnect; any other failure keeps the previous snapshot. Runs in `external`:
 * it calls the provider, and a token refresh must not be rolled back.
 */
export async function runSyncAccounts({
  context,
  row,
}: RunSyncInput): Promise<Result<ProviderConnection>> {
  const port = findProvider({ key: row.provider })?.invoicing;
  if (!port?.listAccounts) return ok({ value: row });
  const auth = await authFor({ context, row });
  if (!auth.ok) return auth;
  const listed = await port.listAccounts({ auth: auth.value });
  if (!listed.ok && listed.error.code !== "FORBIDDEN") return listed;
  const accounts = listed.ok ? listed.value : [];
  const chart = { readable: listed.ok, accounts } as unknown as Prisma.InputJsonValue;
  const updated = await context.db.providerConnection.update({
    where: { id: row.id },
    data: { chart, chartSyncedAt: nowOf({ context }) },
  });
  if (listed.ok) await suggestBasMappings({ context, row: updated, accounts });
  return ok({ value: updated });
}

import type { ProviderConnection } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { ledgerProviderKeys } from "../../providers/registry";
import type { AccountMappingListDto } from "./mapping-schema";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * The connected accounting system (ADR 0108, 0123): the one ledger connection that is not
 * disconnected. An EXPIRED one keeps its mappings (it can be reconnected).
 */
export async function loadLedgerConnection({ context }: Db): Promise<ProviderConnection | null> {
  const rows = await context.db.providerConnection.findMany({
    where: { provider: { in: ledgerProviderKeys() } },
  });
  return (
    rows.find(
      (row) =>
        row.disconnectedAt === null && (row.status === "CONNECTED" || row.status === "EXPIRED"),
    ) ?? null
  );
}

export type LoadMappingsInput = Db & { connection: ProviderConnection | null };

/** The connection's mappings as the surfaces show them, in a stable order. */
export async function loadMappingList({
  context,
  connection,
}: LoadMappingsInput): Promise<AccountMappingListDto> {
  if (!connection) return { provider: null, mappings: [] };
  const rows = await context.db.accountMapping.findMany({
    where: { connectionId: connection.id },
    select: { purpose: true, entityTypeId: true, providerAccount: true },
    orderBy: [{ purpose: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
  return { provider: connection.provider, mappings: rows };
}

/** The mappings as a lookup for invoice rows: advances, default revenue and one per item type. */
export type LedgerMappings = {
  advances: string | null;
  defaultRevenue: string | null;
  byType: ReadonlyMap<string, string>;
};

export type LoadLedgerMappingsInput = Db & { connectionId: string };

export async function loadLedgerMappings({
  context,
  connectionId,
}: LoadLedgerMappingsInput): Promise<LedgerMappings> {
  const rows = await context.db.accountMapping.findMany({
    where: { connectionId },
    select: { purpose: true, entityTypeId: true, providerAccount: true },
  });
  const byType = new Map<string, string>();
  let advances: string | null = null;
  let defaultRevenue: string | null = null;
  for (const row of rows) {
    if (row.purpose === "ADVANCES") advances = row.providerAccount;
    else if (row.purpose === "REVENUE_DEFAULT") defaultRevenue = row.providerAccount;
    else if (row.entityTypeId) byType.set(row.entityTypeId, row.providerAccount);
  }
  return { advances, defaultRevenue, byType };
}

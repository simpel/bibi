import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { Route } from "../../providers/resolve-route";
import { conflict } from "../../shared/errors";
import { requireLedger } from "../payment/require-ledger";
import { type LedgerMappings, loadLedgerMappings } from "./load-mappings";

type Db = { context: Pick<OperationContext, "db"> };

/** What a connection must have mapped before Bibi can raise a document (ADR 0123). */
export type RequiredMappings = { advances: string; defaultRevenue: string; all: LedgerMappings };

export type RequireConnectionMappingsInput = Db & { connectionId: string; provider: string };

/**
 * The deposits and default revenue mappings of one ledger connection, or `CONFLICT` naming what
 * is missing. Every other purpose falls back to Default revenue.
 */
export async function requireConnectionMappings({
  context,
  connectionId,
  provider,
}: RequireConnectionMappingsInput): Promise<Result<RequiredMappings>> {
  const all = await loadLedgerMappings({ context, connectionId });
  const { advances, defaultRevenue } = all;
  const missing = [advances ? null : "Deposits", defaultRevenue ? null : "Default revenue"].filter(
    (name) => name !== null,
  );
  if (advances && defaultRevenue) return ok({ value: { advances, defaultRevenue, all } });
  return conflict({
    message:
      `Map ${missing.join(" and ")} to ${missing.length > 1 ? "accounts" : "an account"} in ` +
      `${provider} first (Administration → Integrations → ${provider}), so invoices and deposits ` +
      "know where to book.",
  });
}

/**
 * `requireLedger` plus the mappings it books with (ADR 0106, 0123): the accounting system that
 * issues every document, with Deposits and Default revenue mapped. A drop-in for `requireLedger`
 * where a document is about to be made.
 */
export async function requireMappings({ context }: Db): Promise<Result<Route>> {
  const ledger = await requireLedger({ context });
  if (!ledger.ok) return ledger;
  const { connection, provider } = ledger.value;
  const mapped = await requireConnectionMappings({
    context,
    connectionId: connection.id,
    provider,
  });
  return mapped.ok ? ledger : mapped;
}

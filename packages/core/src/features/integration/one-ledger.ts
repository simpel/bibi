import { getLogger } from "@bibi/logger";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { ProviderKey } from "../../providers/provider-keys";
import { findProvider, ledgerProviderKeys } from "../../providers/registry";
import { conflict } from "../../shared/errors";

type Db = { context: Pick<OperationContext, "db"> };
export type OneLedgerInput = Db & { provider: ProviderKey };

/**
 * ADR 0108: a venue has at most one connected provider that keeps the books. A ledger provider
 * cannot connect while another one is connected (the admin disconnects it first); reconnecting
 * the same one, and every provider that is not a ledger, is never refused.
 */
export async function checkOneLedger({ context, provider }: OneLedgerInput): Promise<Result<true>> {
  if (!findProvider({ key: provider })?.ledger) return ok({ value: true });
  const others = ledgerProviderKeys().filter((key) => key !== provider);
  const rows = await context.db.providerConnection.findMany({
    where: { provider: { in: others } },
  });
  // An EXPIRED one still holds its open invoices and can be reconnected: it keeps the slot until
  // an admin disconnects it.
  const connected = rows.find(
    (row) =>
      row.disconnectedAt === null && (row.status === "CONNECTED" || row.status === "EXPIRED"),
  );
  if (!connected) return ok({ value: true });
  return conflict({
    message:
      `${connected.provider} is connected and keeps the books. Disconnect it before connecting ` +
      `${provider}; invoices already raised there stay there.`,
  });
}

/**
 * ADR 0108: once a ledger is connected, a saved INVOICE route that names another provider moves
 * to it, so a switch never leaves documents blocked on the system that was disconnected.
 */
export async function moveInvoiceRoute({ context, provider }: OneLedgerInput): Promise<void> {
  if (!findProvider({ key: provider })?.ledger) return;
  const route = await context.db.paymentMethodRoute.findFirst({ where: { method: "INVOICE" } });
  if (!route || route.provider === provider) return;
  await context.db.paymentMethodRoute.update({ where: { id: route.id }, data: { provider } });
  getLogger().info({ event: "integration.invoiceRouteMoved", from: route.provider, to: provider });
}

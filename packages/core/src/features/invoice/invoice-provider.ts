import type { Invoice, ProviderConnection } from "@bibi/db";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { authFor } from "../../providers/connections";
import { findProvider } from "../../providers/registry";
import type { InvoicingPort, ProviderAuth } from "../../providers/types";
import { conflict } from "../../shared/errors";

export type InvoiceProviderCall = {
  invoicing: InvoicingPort;
  auth: ProviderAuth;
  connection: ProviderConnection;
};

export type ProviderCallInput = {
  context: OperationContext;
  invoice: Pick<Invoice, "provider" | "connectionId">;
};

/** Whether the invoice was raised in a provider that keeps invoices (an invoicing port). */
export function raisedInProvider({ invoice }: { invoice: Pick<Invoice, "provider"> }): boolean {
  return invoice.provider ? Boolean(findProvider({ key: invoice.provider })?.invoicing) : false;
}

/**
 * The invoicing port, connection and credentials of the provider the invoice was raised in
 * (ADR 0100). Call it only in `external`: an OAuth token may be refreshed (ADR 0087).
 */
export async function invoiceProviderCall({
  context,
  invoice,
}: ProviderCallInput): Promise<Result<InvoiceProviderCall>> {
  const invoicing = invoice.provider ? findProvider({ key: invoice.provider })?.invoicing : null;
  if (!invoicing) return conflict({ message: "The invoice was not raised in a provider" });
  const connection = await context.db.providerConnection.findFirst({
    where: { id: invoice.connectionId ?? "", status: "CONNECTED" },
  });
  if (!connection) {
    return conflict({
      message: `${invoice.provider} is not connected. Connect it in Settings → Integrations.`,
    });
  }
  const auth = await authFor({ context, row: connection });
  if (!auth.ok) return err({ error: auth.error });
  return ok({ value: { invoicing, auth: auth.value, connection } });
}

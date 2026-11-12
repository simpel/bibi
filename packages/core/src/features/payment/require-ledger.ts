import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { type Route, resolveRoute } from "../../providers/resolve-route";
import { conflict } from "../../shared/errors";

type Db = { context: Pick<OperationContext, "db"> };

const NO_LEDGER =
  "Taking money needs a connected accounting system that issues the invoices. Connect Fortnox " +
  "or Visma eEkonomi in Administration → Integrations and choose it for Invoice under " +
  "Administration → Payments.";

/**
 * The accounting system that issues every money document (ADR 0106): the INVOICE route's
 * provider when it keeps the books and raises invoices. CONFLICT without one, so no payment link,
 * deposit or invoice is made that only Bibi would know of.
 */
export async function requireLedger({ context }: Db): Promise<Result<Route>> {
  const route = await resolveRoute({ context, method: "INVOICE" });
  if (!route.ok) return route;
  const ledger = route.value;
  if (!ledger?.adapter.ledger || !ledger.adapter.invoicing) return conflict({ message: NO_LEDGER });
  return ok({ value: ledger });
}

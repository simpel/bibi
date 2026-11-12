import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { ProviderKey } from "../../providers/provider-keys";
import { resolveRoute } from "../../providers/resolve-route";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { invoiceBuyerReference } from "../invoice/buyer-reference";
import { invoiceProviderCall, raisedInProvider } from "../invoice/invoice-provider";
import { isAmbiguous } from "../payment/refund-at-provider";
import { loadDepositForProvider, toDepositSnapshot } from "./deposit-snapshot";

export type LedgerRoute = { provider: ProviderKey; connectionId: string };

type RouteInput = { context: Pick<OperationContext, "db">; orderId: string };

/**
 * Where a deposit is raised when it is sent (ADR 0106): the INVOICE route's provider when it keeps
 * the books and raises invoices, else null (kept in Bibi). A customer that requires the buyer's
 * reference without one is VALIDATION, before anything is sent.
 */
export async function ledgerRouteOf({
  context,
  orderId,
}: RouteInput): Promise<Result<LedgerRoute | null>> {
  const route = await resolveRoute({ context, method: "INVOICE" });
  if (!route.ok) return route;
  const { value } = route;
  if (!value?.adapter.invoicing || !value.adapter.ledger) return ok({ value: null });
  const reference = await invoiceBuyerReference({ context, orderId });
  if (!reference.ok) return reference;
  return ok({ value: { provider: value.provider, connectionId: value.connection.id } });
}

export type DepositAtProviderInput = { context: OperationContext; id: string };

/**
 * Raises a SENT deposit routed to a ledger provider as a prepayment invoice there (ADR 0106) and
 * stores its document number. Only in `external` (ADR 0058); one already raised, or one kept in
 * Bibi, is a no-op. A failure leaves it unraised: the next payment on it raises it first.
 */
export async function issueDepositInProvider({
  context,
  id,
}: DepositAtProviderInput): Promise<Result<true>> {
  const deposit = await loadDepositForProvider({ context, id });
  if (!deposit) return notFound({ entity: "Deposit" });
  if (deposit.status !== "SENT" || deposit.providerReference) return ok({ value: true });
  if (!raisedInProvider({ invoice: deposit })) return ok({ value: true });
  const call = await invoiceProviderCall({ context, invoice: deposit });
  if (!call.ok) return call;
  const snapshot = await toDepositSnapshot({ context, deposit });
  if (!snapshot.ok) return snapshot;
  const issued = await call.value.invoicing.issue({
    auth: call.value.auth,
    invoice: snapshot.value,
    idempotencyKey: `bibi-deposit-${id}`,
  });
  if (!issued.ok) return issued;
  await context.db.deposit.updateMany({
    where: { id, providerReference: null },
    data: { providerReference: issued.value.providerReference, providerUrl: issued.value.url },
  });
  return ok({ value: true });
}

/** A definite refusal: the prepayment invoice is still open, so Bibi's VOID is undone. */
async function rollBack({ context, id }: DepositAtProviderInput) {
  await context.db.deposit.updateMany({
    where: { id, status: "VOID" },
    data: { status: "SENT", voidedAt: null, statusChangedAt: nowOf({ context }) },
  });
}

/**
 * `deposit.void` after the commit (ADR 0100, 0106): a prepayment invoice booked in a ledger is
 * credited in full there. A definite refusal makes the deposit SENT again; an unanswered call
 * keeps it VOID and says so, since crediting twice would be worse than checking once.
 */
export async function creditDepositAtProvider({
  context,
  id,
}: DepositAtProviderInput): Promise<Result<true>> {
  const deposit = await loadDepositForProvider({ context, id });
  if (!deposit?.providerReference || !raisedInProvider({ invoice: deposit })) {
    return ok({ value: true });
  }
  const call = await invoiceProviderCall({ context, invoice: deposit });
  const credited = call.ok
    ? await call.value.invoicing.credit({
        auth: call.value.auth,
        providerReference: deposit.providerReference,
        amountMinor: deposit.amountMinor,
        reason: "Deposit voided",
        idempotencyKey: `bibi-deposit-void-${id}`,
      })
    : call;
  if (credited.ok) return ok({ value: true });
  const log = { depositId: id, err: credited.error };
  if (isAmbiguous({ error: credited.error })) {
    getLogger().warn({ event: "deposit.creditUnconfirmed", ...log });
    const message = `${deposit.provider} did not confirm the credit of the prepayment invoice; the deposit stays void, check it in ${deposit.provider}`;
    return err({ error: new AppError({ code: "UNAVAILABLE", message, cause: credited.error }) });
  }
  await rollBack({ context, id });
  getLogger().warn({ event: "deposit.creditFailed", ...log });
  const message = `${deposit.provider} refused to credit the prepayment invoice, so the deposit is SENT again: ${credited.error.message}`;
  return err({
    error: new AppError({ code: credited.error.code, message, cause: credited.error }),
  });
}

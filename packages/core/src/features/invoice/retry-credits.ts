import { getLogger } from "@bibi/logger";
import { ok, type Result } from "../../errors/result";
import type { InvoicingPort, ProviderAuth } from "../../providers/types";
import { nowOf } from "../../time/now";
import { invoiceProviderCall, type ProviderCallContext } from "./invoice-provider";

/** A credit still unconfirmed this long is read at the provider again (the refund retry window). */
export const CREDIT_RETRY_AFTER_MS = 15 * 60_000;
const BATCH = 100;

export type CreditRetryOutcome = { issued: number; failed: number; waiting: number };

type Call = { invoicing: InvoicingPort; auth: ProviderAuth };
type Settled = "issued" | "failed" | "waiting";

type ResolveInput = {
  call: Call;
  /** The credited document at the provider. */
  documentReference: string;
  amountMinor: number;
  reason: string | null;
  idempotencyKey: string;
};

/**
 * Reads the credit at the provider and sends it again only when the provider never got it, so a
 * lost answer never credits twice. Without `creditStatus` it waits for staff. The new reference,
 * or null while it waits; `failed` on a definite refusal.
 */
async function resolveCredit({ call, documentReference, ...credit }: ResolveInput) {
  const { invoicing, auth } = call;
  if (!invoicing.creditStatus) return { outcome: "waiting" as Settled, reference: null };
  const state = await invoicing.creditStatus({ auth, providerReference: documentReference });
  if (!state.ok) return { outcome: "waiting" as Settled, reference: null };
  if (state.value.status === "ISSUED") {
    return { outcome: "issued" as Settled, reference: state.value.providerReference };
  }
  const sent = await invoicing.credit({ auth, providerReference: documentReference, ...credit });
  if (sent.ok) return { outcome: "issued" as Settled, reference: sent.value.providerReference };
  const code = sent.error.code;
  return {
    outcome: (code === "UNAVAILABLE" || code === "INTERNAL" ? "waiting" : "failed") as Settled,
    reference: null,
  };
}

type RetryInput = { context: ProviderCallContext };
type StepInput = RetryInput & { outcome: CreditRetryOutcome };

/** Invoice credit notes left PENDING by an unanswered call (ADR 0100). */
async function retryCreditNotes({ context, outcome }: StepInput) {
  const before = new Date(nowOf({ context }).getTime() - CREDIT_RETRY_AFTER_MS);
  const notes = await context.db.creditNote.findMany({
    where: { status: "PENDING", createdAt: { lt: before }, provider: { not: null } },
    include: { invoice: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: BATCH,
  });
  for (const note of notes) {
    const { invoice } = note;
    if (!invoice.providerReference) continue;
    const call = await invoiceProviderCall({ context, invoice });
    if (!call.ok) {
      outcome.waiting++;
      continue;
    }
    const done = await resolveCredit({
      call: call.value,
      documentReference: invoice.providerReference,
      amountMinor: note.amountMinor,
      reason: note.reason,
      idempotencyKey: `bibi-credit-${note.id}`,
    });
    outcome[done.outcome]++;
    if (done.outcome === "waiting") continue;
    await context.db.creditNote.updateMany({
      where: { id: note.id, status: "PENDING" },
      data:
        done.outcome === "issued"
          ? { status: "ISSUED", issuedAt: nowOf({ context }), providerReference: done.reference }
          : { status: "FAILED" },
    });
  }
}

/** Deposits whose prepayment invoice's credit on void was left unconfirmed (ADR 0106). */
async function retryDepositCredits({ context, outcome }: StepInput) {
  const before = new Date(nowOf({ context }).getTime() - CREDIT_RETRY_AFTER_MS);
  const deposits = await context.db.deposit.findMany({
    where: { status: "VOID", creditPendingAt: { lt: before }, providerReference: { not: null } },
    orderBy: [{ creditPendingAt: "asc" }, { id: "asc" }],
    take: BATCH,
  });
  for (const deposit of deposits) {
    const call = await invoiceProviderCall({ context, invoice: deposit });
    if (!call.ok || !deposit.providerReference) {
      outcome.waiting++;
      continue;
    }
    const done = await resolveCredit({
      call: call.value,
      documentReference: deposit.providerReference,
      amountMinor: deposit.amountMinor,
      reason: "Deposit voided",
      idempotencyKey: `bibi-deposit-void-${deposit.id}`,
    });
    outcome[done.outcome]++;
    if (done.outcome === "issued") {
      await context.db.deposit.updateMany({
        where: { id: deposit.id },
        data: { creditPendingAt: null },
      });
    } else if (done.outcome === "failed") {
      getLogger().warn({ event: "deposit.creditFailed", depositId: deposit.id });
    }
  }
}

/**
 * The credit retry (ADR 0100, 0106), run by the worker's `payment.refundRetry` job per organization
 * as SYSTEM after the refunds: every credit note and deposit credit left unconfirmed for 15 minutes
 * is read at its provider and settled, or sent again when the provider never got it.
 */
export async function retryCredits({ context }: RetryInput): Promise<Result<CreditRetryOutcome>> {
  const outcome: CreditRetryOutcome = { issued: 0, failed: 0, waiting: 0 };
  await retryCreditNotes({ context, outcome });
  await retryDepositCredits({ context, outcome });
  return ok({ value: outcome });
}

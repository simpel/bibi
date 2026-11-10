import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { isAmbiguous } from "../payment/refund-at-provider";
import { invoiceProviderCall, raisedInProvider } from "./invoice-provider";
import type { InvoiceDto } from "./schema";
import { loadInvoice } from "./to-invoice-dto";

type Context = Pick<OperationContext, "db" | "organizationId" | "now">;

export type VoidAtProviderInput = { context: OperationContext; invoice: InvoiceDto };

/**
 * A definite refusal: the invoice is still open at the provider, so Bibi's VOID is undone
 * (SENT again, `voidedAt` cleared). Only from VOID: a move meanwhile wins.
 */
async function rollBack({ context, id }: { context: Context; id: string }) {
  await context.db.invoice.updateMany({
    where: { id, status: "VOID" },
    data: {
      status: "SENT",
      voidedAt: null,
      voidPendingAt: null,
      statusChangedAt: nowOf({ context }),
    },
  });
}

export type VoidOutcome = "voided" | "pending" | "refused";

type CallInput = { context: OperationContext; id: string };

/**
 * Voids the invoice at the provider it was raised in and settles Bibi's side by the answer
 * (ADR 0058, 0100): confirmed clears `voidPendingAt`; a definite refusal rolls the invoice back
 * to SENT (`invoice.voidFailed`); an ambiguous failure keeps it VOID with `voidPendingAt` set,
 * for the refund retry job to try again.
 */
export async function callVoid({ context, id }: CallInput): Promise<Result<VoidOutcome>> {
  const row = await context.db.invoice.findFirst({ where: { id } });
  if (!row) return notFound({ entity: "Invoice" });
  if (!row.providerReference || !raisedInProvider({ invoice: row })) return ok({ value: "voided" });
  const call = await invoiceProviderCall({ context, invoice: row });
  const voided = call.ok
    ? await call.value.invoicing.void({
        auth: call.value.auth,
        providerReference: row.providerReference,
      })
    : call;
  if (voided.ok) {
    await context.db.invoice.updateMany({ where: { id }, data: { voidPendingAt: null } });
    return ok({ value: "voided" });
  }
  if (isAmbiguous({ error: voided.error })) {
    await context.db.invoice.updateMany({
      where: { id, status: "VOID", voidPendingAt: null },
      data: { voidPendingAt: nowOf({ context }) },
    });
    getLogger().warn({ event: "invoice.voidUnconfirmed", invoiceId: id, err: voided.error });
    return err({ error: voided.error });
  }
  await rollBack({ context, id });
  getLogger().warn({ event: "invoice.voidFailed", invoiceId: id, err: voided.error });
  return err({ error: voided.error });
}

/** `invoice.void`'s call after the commit: the voided invoice, or why the provider did not. */
export async function voidAtProvider({
  context,
  invoice,
}: VoidAtProviderInput): Promise<Result<InvoiceDto>> {
  if (!invoice.providerReference || !raisedInProvider({ invoice })) return ok({ value: invoice });
  const done = await callVoid({ context, id: invoice.id });
  if (!done.ok && isAmbiguous({ error: done.error })) {
    const message =
      `${invoice.provider} did not confirm the void; the invoice stays void and Bibi tries ` +
      "again until it does";
    return err({ error: new AppError({ code: "UNAVAILABLE", message, cause: done.error }) });
  }
  if (!done.ok) {
    const message = `${invoice.provider} refused the void, so the invoice is SENT again: ${done.error.message}`;
    return err({ error: new AppError({ code: done.error.code, message, cause: done.error }) });
  }
  const after = await loadInvoice({ context, id: invoice.id });
  return after ? ok({ value: after }) : notFound({ entity: "Invoice" });
}

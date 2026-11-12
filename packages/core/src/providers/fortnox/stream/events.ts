import { type Db, getDb } from "@bibi/db";
import { z } from "zod";
import { syncDepositWithProvider } from "../../../features/deposit/sync-deposit";
import { applyInvoiceSignal } from "../../../features/invoice/apply-signal-operation";
import { syncInvoice } from "../../../features/invoice/sync-operation";
import { execute } from "../../../operations/execute";
import { providerSystemContext } from "../../system-context";

/** One event from Fortnox's Topics stream (ADR 0090); only what Bibi reads. */
export const FortnoxTopicEventSchema = z.object({
  topic: z.string(),
  offset: z.string(),
  type: z.string(),
  tenantId: z.coerce.number().int(),
  entityId: z.coerce.string().optional(),
  invoiceId: z.coerce.string().optional(),
});

export type FortnoxTopicEvent = z.infer<typeof FortnoxTopicEventSchema>;

export type FortnoxEventOutcome = "applied" | "ignored" | "unmatched" | "failed";

const PAYMENT_EVENTS = new Set(["invoicepayment-bookkeep-v1", "invoicepayment-deleted-v1"]);

/**
 * A payment event on a deposit's prepayment invoice (ADR 0106): its booked payments are read
 * again. A cancelled prepayment invoice changes nothing (Bibi voids it with `deposit.void`).
 */
async function depositEvent({
  context,
  event,
  documentNumber,
}: {
  context: ReturnType<typeof providerSystemContext>;
  event: FortnoxTopicEvent;
  documentNumber: string;
}): Promise<FortnoxEventOutcome> {
  const deposit = await context.db.deposit.findFirst({
    where: { provider: "FORTNOX", providerReference: documentNumber },
    select: { id: true },
  });
  if (!deposit || event.type === "invoice-cancelled-v1") return "ignored";
  const done = await syncDepositWithProvider({ context, id: deposit.id });
  return done.ok ? "applied" : "failed";
}

/** The invoice's document number the event is about, for the events Bibi acts on. */
function documentOf({ event }: { event: FortnoxTopicEvent }): string | null {
  if (PAYMENT_EVENTS.has(event.type)) return event.invoiceId ?? null;
  if (event.type === "invoice-cancelled-v1") return event.entityId ?? null;
  return null;
}

export type HandleEventInput = { db?: Db; event: FortnoxTopicEvent };

/**
 * Routes a Topics event to the organization it belongs to (the one cross-organization lookup,
 * tenant id → connection, ADR 0004) and runs, as SYSTEM, `invoice.sync` for a payment event (it
 * reads the booked payments and applies them as signals) or `invoice.applySignal` with
 * `invoice.voided` for a cancelled invoice. Events for invoices Bibi did not raise are ignored.
 */
export async function handleFortnoxEvent({
  db = getDb(),
  event,
}: HandleEventInput): Promise<FortnoxEventOutcome> {
  const documentNumber = documentOf({ event });
  if (!documentNumber) return "ignored";
  const connection = await db.providerConnection.findFirst({
    where: { provider: "FORTNOX", externalAccountId: String(event.tenantId) },
    select: { organizationId: true },
  });
  if (!connection) return "unmatched";
  const context = providerSystemContext({ db, organizationId: connection.organizationId });
  const invoice = await context.db.invoice.findFirst({
    where: { provider: "FORTNOX", providerReference: documentNumber },
    select: { id: true },
  });
  if (!invoice) return depositEvent({ context, event, documentNumber });
  const done =
    event.type === "invoice-cancelled-v1"
      ? await execute({
          operation: applyInvoiceSignal,
          input: {
            invoiceId: invoice.id,
            signal: {
              provider: "FORTNOX",
              eventId: `${event.topic}:${event.offset}`,
              kind: "invoice.voided",
              externalAccountId: String(event.tenantId),
              documentReference: documentNumber,
              occurredAt: new Date(),
            },
          },
          context,
        })
      : await execute({ operation: syncInvoice, input: { id: invoice.id }, context });
  return done.ok ? "applied" : "failed";
}

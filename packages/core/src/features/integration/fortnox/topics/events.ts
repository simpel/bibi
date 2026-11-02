import { type Db, getDb } from "@bibi/db";
import { z } from "zod";
import { execute } from "../../../../operations/execute";
import { voidInvoice } from "../../../invoice/lifecycle-operations";
import { syncInvoice } from "../../../invoice/sync-operation";
import { fortnoxSystemContext } from "./system-context";

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

/** The invoice's document number the event is about, for the events Bibi acts on. */
function documentOf({ event }: { event: FortnoxTopicEvent }): string | null {
  if (PAYMENT_EVENTS.has(event.type)) return event.invoiceId ?? null;
  if (event.type === "invoice-cancelled-v1") return event.entityId ?? null;
  return null;
}

export type HandleEventInput = { db?: Db; event: FortnoxTopicEvent };

/**
 * Routes a Topics event to the organization it belongs to (the one cross-organization lookup,
 * tenant id → connection, ADR 0004) and runs, as SYSTEM, `invoice.sync` for a payment event or
 * `invoice.void` for a cancelled invoice. Events for invoices Bibi did not raise are ignored.
 */
export async function handleFortnoxEvent({
  db = getDb(),
  event,
}: HandleEventInput): Promise<FortnoxEventOutcome> {
  const documentNumber = documentOf({ event });
  if (!documentNumber) return "ignored";
  const connection = await db.integrationConnection.findFirst({
    where: { provider: "FORTNOX", fortnoxTenantId: event.tenantId },
    select: { organizationId: true },
  });
  if (!connection) return "unmatched";
  const context = fortnoxSystemContext({ db, organizationId: connection.organizationId });
  const invoice = await context.db.invoice.findFirst({
    where: { provider: "FORTNOX", providerReference: documentNumber },
    select: { id: true },
  });
  if (!invoice) return "ignored";
  const operation = event.type === "invoice-cancelled-v1" ? voidInvoice : syncInvoice;
  const done = await execute({ operation, input: { id: invoice.id }, context });
  return done.ok ? "applied" : "failed";
}

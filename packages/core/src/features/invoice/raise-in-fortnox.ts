import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import { revenueAccountResolver } from "../finance/account-map";
import { loadAccountingSettings } from "../finance/load-settings";
import { getFortnoxAccessToken } from "../integration/fortnox/access-token";
import { getFortnoxInvoicingGateway } from "../integration/fortnox/invoicing-registry";
import { fortnoxRows } from "./fortnox-rows";

export type RaiseInFortnoxInput = { context: OperationContext; invoiceId: string };

const day = ({ instant, timeZone }: { instant: Date; timeZone: string }) =>
  toIsoDate({ date: toZonedParts({ instant, timeZone }).date });

async function loadForFortnox({ context, invoiceId }: RaiseInFortnoxInput) {
  return context.db.invoice.findFirst({
    where: { id: invoiceId },
    include: {
      lines: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: { item: { select: { entityTypeId: true } } },
      },
      deductions: { include: { deposit: { select: { description: true } } } },
      ticket: { select: { reference: true, customer: { select: { name: true, email: true } } } },
    },
  });
}

/**
 * Raises a SENT invoice in the organization's Fortnox (ADR 0090): finds or creates the customer,
 * creates the invoice from the frozen rows, books it and emails it when the customer has an
 * email, then stores Fortnox's document number. Runs only in an `external` step (ADR 0058).
 */
export async function raiseInFortnox({
  context,
  invoiceId,
}: RaiseInFortnoxInput): Promise<Result<string>> {
  const invoice = await loadForFortnox({ context, invoiceId });
  if (!invoice) return notFound({ entity: "Invoice" });
  if (invoice.providerReference) return ok({ value: invoice.providerReference });
  const [settings, zoneOf, token] = await Promise.all([
    loadAccountingSettings({ context }),
    loadZoneOfVenue({ context }),
    getFortnoxAccessToken({ context }),
  ]);
  const timeZone = zoneOf({ venue: null });
  if (!token.ok) return err({ error: token.error });
  const gateway = getFortnoxInvoicingGateway();
  const { customer, reference } = invoice.ticket;
  const customerNumber = await gateway.findOrCreateCustomer({
    accessToken: token.value,
    ...customer,
  });
  if (!customerNumber.ok) return customerNumber;
  const accountOf = revenueAccountResolver({ settings });
  const raised = await gateway.raiseInvoice({
    accessToken: token.value,
    email: customer.email !== null,
    customerNumber: customerNumber.value,
    invoiceDate: day({ instant: invoice.sentAt ?? new Date(), timeZone }),
    dueDate: invoice.dueDate ? day({ instant: invoice.dueDate, timeZone }) : null,
    currency: invoice.currency,
    yourOrderNumber: `Ticket #${reference}, invoice #${invoice.number}`,
    rows: fortnoxRows({ ...invoice, accountOf, advancesAccount: settings.advancesAccount }),
  });
  if (!raised.ok) return raised;
  await context.db.invoice.update({
    where: { id: invoiceId },
    data: { providerReference: raised.value },
  });
  return raised;
}

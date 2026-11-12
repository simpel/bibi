import type { OperationContext } from "../../operations/types";
import type { InvoiceSnapshot } from "../../providers/types";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import { revenueAccountResolver } from "../finance/account-map";
import { loadAccountingSettings } from "../finance/load-settings";
import { asVatRows } from "../quote/order-line-schema";

const day = ({ instant, timeZone }: { instant: Date; timeZone: string }) =>
  toIsoDate({ date: toZonedParts({ instant, timeZone }).date });

/** The order's reference and its buyer as providers need them (ADR 0106). */
export const ORDER_FOR_PROVIDER = {
  reference: true,
  buyerKind: true,
  customer: { select: { name: true, email: true, organizationNumber: true, buyerKind: true } },
} as const;

type OrderForProvider = {
  buyerKind: "BUSINESS" | "PRIVATE" | null;
  customer: {
    name: string;
    email: string | null;
    organizationNumber: string | null;
    buyerKind: "BUSINESS" | "PRIVATE";
  };
};

/** The buyer of the order: the customer with the order's effective kind (ADR 0106). */
export function buyerOf({ order }: { order: OrderForProvider }): InvoiceSnapshot["customer"] {
  const { customer } = order;
  const buyerKind = order.buyerKind ?? customer.buyerKind;
  return {
    name: customer.name,
    email: customer.email,
    organizationNumber: buyerKind === "BUSINESS" ? customer.organizationNumber : null,
    buyerKind,
  };
}

export type LoadForProviderInput = { context: OperationContext; invoiceId: string };

/** The invoice with what a provider needs: frozen lines, deductions, customer, connection. */
export function loadForProvider({ context, invoiceId }: LoadForProviderInput) {
  return context.db.invoice.findFirst({
    where: { id: invoiceId },
    include: {
      lines: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: { item: { select: { entityTypeId: true } } },
      },
      deductions: { include: { deposit: { select: { description: true, vatRows: true } } } },
      order: { select: ORDER_FOR_PROVIDER },
    },
  });
}

type LoadedInvoice = NonNullable<Awaited<ReturnType<typeof loadForProvider>>>;

export type ToSnapshotInput = { context: OperationContext; invoice: LoadedInvoice };

/**
 * The frozen invoice as a provider raises it (ADR 0052, 0100): the lines that count with the
 * revenue account the SIE export posts them to (ADR 0077), the deducted deposits on the customer
 * advances account, and the dates in the organization's zone.
 */
export async function toInvoiceSnapshot({
  context,
  invoice,
}: ToSnapshotInput): Promise<InvoiceSnapshot> {
  const [settings, zoneOf] = await Promise.all([
    loadAccountingSettings({ context }),
    loadZoneOfVenue({ context }),
  ]);
  const timeZone = zoneOf({ venue: null });
  const accountOf = revenueAccountResolver({ settings });
  const { reference } = invoice.order;
  const customer = buyerOf({ order: invoice.order });
  return {
    invoiceDate: day({ instant: invoice.sentAt ?? new Date(), timeZone }),
    dueDate: invoice.dueDate ? day({ instant: invoice.dueDate, timeZone }) : null,
    currency: invoice.currency,
    reference: `Order #${reference}, invoice #${invoice.number}`,
    buyerReference: invoice.buyerReference,
    customer,
    lines: invoice.lines
      .filter((line) => line.inTotal)
      .map((line) => ({
        name: line.name,
        quantity: Number(line.quantity),
        unitPriceMinor: line.unitPriceMinor,
        discountPercent: line.discountPercent.toNumber(),
        vatRatePercent: line.vatRatePercent,
        vatRows: asVatRows({ value: line.vatRows }),
        revenueAccount: accountOf({ line }),
      })),
    deductions: invoice.deductions.map(({ amountMinor, deposit }) => ({
      description: deposit.description,
      amountMinor,
      vatRows: deposit.vatRows,
    })),
    advancesAccount: settings.advancesAccount,
  };
}

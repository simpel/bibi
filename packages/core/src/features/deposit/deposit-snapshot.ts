import type { Deposit } from "@bibi/db";
import type { Result } from "../../errors/result";
import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { InvoiceSnapshot, InvoiceSnapshotLine } from "../../providers/types";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import { loadAccountingSettings } from "../finance/load-settings";
import { invoiceBuyerReference } from "../invoice/buyer-reference";
import { buyerOf, ORDER_FOR_PROVIDER } from "../invoice/invoice-snapshot";
import { asVatRows } from "../quote/order-line-schema";

const day = ({ instant, timeZone }: { instant: Date; timeZone: string }) =>
  toIsoDate({ date: toZonedParts({ instant, timeZone }).date });

type DepositRow = Deposit & {
  order: { reference: number } & Parameters<typeof buyerOf>[0]["order"];
};

type LinesInput = { deposit: DepositRow; account: string };

/**
 * The prepayment invoice's rows (ADR 0093, 0106): one per VAT rate of the deposit's split, priced
 * excl. VAT on the customer advances account, so the provider reports the VAT when it is paid. A
 * deposit without a split is one row without VAT.
 */
function prepaymentLines({ deposit, account }: LinesInput): InvoiceSnapshotLine[] {
  const rows = asVatRows({ value: deposit.vatRows });
  const line = ({ name, rate, exclVat }: { name: string; rate: number; exclVat: number }) => ({
    name,
    quantity: 1,
    unitPriceMinor: exclVat,
    discountPercent: 0,
    vatRatePercent: rate,
    vatRows: [{ vatRatePercent: rate, totalExclVatMinor: exclVat }],
    revenueAccount: account,
  });
  if (rows.length === 0) {
    return [line({ name: deposit.description, rate: 0, exclVat: deposit.amountMinor })];
  }
  return rows.map((row) =>
    line({
      name:
        rows.length > 1 ? `${deposit.description} (${row.vatRatePercent} %)` : deposit.description,
      rate: row.vatRatePercent,
      exclVat: row.totalExclVatMinor,
    }),
  );
}

export type LoadDepositForProviderInput = { context: Pick<OperationContext, "db">; id: string };

/** The deposit with what a provider needs: its order's reference and customer. */
export function loadDepositForProvider({ context, id }: LoadDepositForProviderInput) {
  return context.db.deposit.findFirst({
    where: { id },
    include: {
      order: { select: ORDER_FOR_PROVIDER },
    },
  });
}

export type ToDepositSnapshotInput = { context: OperationContext; deposit: DepositRow };

/**
 * The deposit as the ledger provider raises it, as a prepayment invoice (ADR 0106): its VAT split
 * on the advances account, the order's buyer's reference (ADR 0105), dated in the organization's
 * zone. VALIDATION when the customer requires a reference and there is none.
 */
export async function toDepositSnapshot({
  context,
  deposit,
}: ToDepositSnapshotInput): Promise<Result<InvoiceSnapshot>> {
  const [settings, zoneOf, buyerReference] = await Promise.all([
    loadAccountingSettings({ context }),
    loadZoneOfVenue({ context }),
    invoiceBuyerReference({ context, orderId: deposit.orderId }),
  ]);
  if (!buyerReference.ok) return buyerReference;
  const timeZone = zoneOf({ venue: null });
  return ok({
    value: {
      invoiceDate: day({ instant: deposit.sentAt ?? new Date(), timeZone }),
      dueDate: deposit.dueDate ? day({ instant: deposit.dueDate, timeZone }) : null,
      currency: deposit.currency,
      reference: `Order #${deposit.order.reference}, deposit`,
      buyerReference: buyerReference.value,
      customer: buyerOf({ order: deposit.order }),
      lines: prepaymentLines({ deposit, account: settings.advancesAccount }),
      deductions: [],
      advancesAccount: settings.advancesAccount,
    },
  });
}

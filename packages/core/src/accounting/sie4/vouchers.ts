import { ok, type Result } from "../../errors/result";
import { invalid } from "../../shared/errors";
import type { AccountMap } from "./accounts";
import {
  type AccountingEvent,
  type CashEvent,
  type InvoiceEvent,
  missingVatRates,
  type Settles,
} from "./events";
import { type Build, saleCredits, scaleParts, withRounding } from "./sale";
import { voucherText } from "./text";
import type { SieTransaction, SieVoucher } from "./types";

/** The credit side of a payment: receivables, customer advances or the sale itself. */
function paymentCredits({
  accounts,
  project,
  settles,
  amountMinor,
}: Build & { settles: Settles; amountMinor: number }) {
  if (settles.kind === "QUOTE") {
    return saleCredits({
      accounts,
      project,
      parts: scaleParts({ parts: settles.parts, amountMinor }),
    });
  }
  const account = settles.kind === "INVOICE" ? accounts.receivable : accounts.advances;
  return [{ account, amountMinor: -amountMinor, objects: project }];
}

const negate = ({ lines }: { lines: SieTransaction[] }) =>
  lines.map((line) => ({ ...line, amountMinor: -line.amountMinor }));

/** The sale, plus moving paid deposits from customer advances to receivables. */
function invoiceLines({ event, ...build }: Build & { event: InvoiceEvent }): SieTransaction[] {
  const { accounts, project } = build;
  const sale = withRounding({
    accounts,
    lines: [
      { account: accounts.receivable, amountMinor: event.totalInclVatMinor, objects: project },
      ...saleCredits({ ...build, parts: event.parts }),
    ],
  });
  const offset = event.depositOffsetMinor;
  if (offset <= 0) return sale;
  return [
    ...sale,
    { account: accounts.advances, amountMinor: offset },
    { account: accounts.receivable, amountMinor: -offset },
  ];
}

/** Clearing against what the payment settled. */
function cashLines({ event, ...build }: Build & { event: CashEvent }): SieTransaction[] {
  const { amountMinor, settles } = event;
  return [
    { account: build.accounts.clearing, amountMinor },
    ...paymentCredits({ ...build, settles, amountMinor }),
  ];
}

/** The transactions of one event, debit positive; reversals are the original negated. */
function transactionsOf({ event, ...build }: Build & { event: AccountingEvent }): SieTransaction[] {
  const { accounts, project } = build;
  switch (event.kind) {
    case "FEE":
      return [
        { account: accounts.fees, amountMinor: event.amountMinor, objects: project },
        { account: accounts.clearing, amountMinor: -event.amountMinor },
      ];
    case "PAYMENT":
      return cashLines({ ...build, event });
    case "REFUND":
      return negate({ lines: cashLines({ ...build, event }) });
    case "INVOICE_SENT":
      return invoiceLines({ ...build, event });
    case "INVOICE_VOID":
      return negate({ lines: invoiceLines({ ...build, event }) });
  }
}

export type BuildVouchersInput = { accounts: AccountMap; events: readonly AccountingEvent[] };

/**
 * One voucher per event, in date order; the ticket is the project object (dimension 6).
 * VALIDATION when a VAT rate in use has no output VAT account.
 */
export function buildVouchers({ accounts, events }: BuildVouchersInput): Result<SieVoucher[]> {
  const missing = missingVatRates({ accounts, events });
  if (missing.length > 0) {
    const message = `No output VAT account for ${missing.map((rate) => `${rate} %`).join(", ")}`;
    return invalid({ message });
  }
  const vouchers = [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((event) => {
      const project = [{ dimension: 6, id: String(event.ticketReference) }];
      const transactions = transactionsOf({ accounts, project, event }).filter(
        (line) => line.amountMinor !== 0,
      );
      return { date: event.date, text: voucherText({ event }), transactions };
    });
  return ok({ value: vouchers });
}

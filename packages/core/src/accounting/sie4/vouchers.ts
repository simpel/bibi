import { ok, type Result } from "../../errors/result";
import { invalid } from "../../shared/errors";
import type { AccountMap } from "./accounts";
import {
  type AccountingEvent,
  type CashEvent,
  type DepositVat,
  type InvoiceEvent,
  missingVatRates,
  type Settles,
} from "./events";
import { type Build, saleCredits, scaleParts, withRounding } from "./sale";
import { voucherText } from "./text";
import type { SieTransaction, SieVoucher } from "./types";

/**
 * An advance received (ADR 0093): customer advances excl. VAT and output VAT per rate, the
 * deposit's split scaled to the amount; all on advances when the deposit carries no VAT.
 */
function advanceCredits({
  accounts,
  project,
  parts,
  amountMinor,
}: Build & DepositVat & { amountMinor: number }) {
  if (parts.length === 0)
    return [{ account: accounts.advances, amountMinor: -amountMinor, objects: project }];
  const scaled = scaleParts({ parts, amountMinor }).map((part) => ({
    ...part,
    account: accounts.advances,
  }));
  return saleCredits({ accounts, project, parts: scaled });
}

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
  if (settles.kind === "DEPOSIT") {
    return advanceCredits({ accounts, project, parts: settles.parts, amountMinor });
  }
  return [{ account: accounts.receivable, amountMinor: -amountMinor, objects: project }];
}

const negate = ({ lines }: { lines: SieTransaction[] }) =>
  lines.map((line) => ({ ...line, amountMinor: -line.amountMinor }));

/** The sale, plus reversing each deducted deposit's advance and VAT against receivables. */
function invoiceLines({ event, ...build }: Build & { event: InvoiceEvent }): SieTransaction[] {
  const { accounts, project } = build;
  const sale = withRounding({
    accounts,
    lines: [
      { account: accounts.receivable, amountMinor: event.totalInclVatMinor, objects: project },
      ...saleCredits({ ...build, parts: event.parts }),
    ],
  });
  const deducted = event.deductions.flatMap(({ parts, amountMinor }) => [
    ...negate({ lines: advanceCredits({ ...build, parts, amountMinor }) }),
    { account: accounts.receivable, amountMinor: -amountMinor, objects: project },
  ]);
  return [...sale, ...deducted];
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
 * One voucher per event, in date order; the order is the project object (dimension 6).
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
      const project = [{ dimension: 6, id: String(event.orderReference) }];
      const transactions = transactionsOf({ accounts, project, event }).filter(
        (line) => line.amountMinor !== 0,
      );
      return { date: event.date, text: voucherText({ event }), transactions };
    });
  return ok({ value: vouchers });
}

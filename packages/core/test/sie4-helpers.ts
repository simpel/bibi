import type { AccountMap } from "../src/accounting/sie4/accounts";
import type { AccountingEvent, InvoiceEvent } from "../src/accounting/sie4/events";
import { buildVouchers } from "../src/accounting/sie4/vouchers";
import { unwrap } from "./helpers";

export const ACCOUNTS: AccountMap = {
  receivable: "1510",
  clearing: "1580",
  advances: "2420",
  fees: "6570",
  rounding: "3740",
  vatOutput: { 25: "2611", 12: "2621", 6: "2631" },
};

export const base = { date: "2026-10-05", ticketReference: 1045 };
export const lunch = {
  account: "3001",
  vatRatePercent: 12,
  exclVatMinor: 500_000,
  vatMinor: 60_000,
};
export const room = {
  account: "3010",
  vatRatePercent: 25,
  exclVatMinor: 200_000,
  vatMinor: 50_000,
};

/** A 1 000 kr deposit split like the ticket (ADR 0093): 560 kr at 12 %, 440 kr at 25 %. */
export const depositVat = {
  parts: [
    { vatRatePercent: 12, exclVatMinor: 50_000, vatMinor: 6_000 },
    { vatRatePercent: 25, exclVatMinor: 35_200, vatMinor: 8_800 },
  ],
};

export const invoice: InvoiceEvent = {
  ...base,
  kind: "INVOICE_SENT",
  invoiceNumber: 12,
  totalInclVatMinor: 810_000,
  parts: [lunch, room],
  deductions: [{ amountMinor: 100_000, ...depositVat }],
};

export const accountsOf = ({
  transactions,
}: {
  transactions: readonly { account: string; amountMinor: number }[];
}) =>
  Object.fromEntries(
    transactions.map((t) => [`${t.account}${t.amountMinor > 0 ? "D" : "C"}`, t.amountMinor]),
  );

export const sumOf = ({ minors }: { minors: number[] }) => minors.reduce((a, b) => a + b, 0);
export const build = ({ events }: { events: AccountingEvent[] }) =>
  unwrap({ result: buildVouchers({ accounts: ACCOUNTS, events }) });

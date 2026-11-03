import { describe, expect, it } from "vitest";
import { decodeCp437, encodeCp437 } from "../src/accounting/sie4/cp437";
import type { AccountingEvent } from "../src/accounting/sie4/events";
import type { SieFile } from "../src/accounting/sie4/types";
import { buildVouchers } from "../src/accounting/sie4/vouchers";
import { amount, writeSie, writeSieText } from "../src/accounting/sie4/write";
import { errorCode, unwrap } from "./helpers";

import {
  ACCOUNTS,
  accountsOf,
  base,
  build,
  depositVat,
  invoice,
  lunch,
  room,
  sumOf,
} from "./sie4-helpers";

describe("SIE 4 vouchers (ADR 0077)", () => {
  it("posts an invoice: the sale, and each deposit's advance and VAT reversed (ADR 0093)", () => {
    const [voucher] = build({ events: [invoice] });
    expect(accountsOf({ transactions: voucher?.transactions ?? [] })).toEqual({
      "1510D": 810_000,
      "3001C": -500_000,
      "2621C": -60_000,
      "3010C": -200_000,
      "2611C": -50_000,
      "2420D": 85_200,
      "2621D": 6_000,
      "2611D": 8_800,
      "1510C": -100_000,
    });
    expect(voucher?.text).toBe("Invoice 12, ticket 1045");
  });

  it("balances every voucher, and a void or refund is the exact reversal", () => {
    const quotePart = { kind: "QUOTE" as const, parts: [lunch, room] };
    const events: AccountingEvent[] = [
      invoice,
      { ...invoice, kind: "INVOICE_VOID", date: "2026-10-09" },
      { ...base, kind: "PAYMENT", amountMinor: 405_000, settles: quotePart },
      { ...base, kind: "REFUND", amountMinor: 405_000, settles: quotePart },
      {
        ...base,
        kind: "PAYMENT",
        amountMinor: 100_000,
        settles: { kind: "DEPOSIT", ...depositVat },
      },
      { ...base, kind: "FEE", amountMinor: 1_215 },
    ];
    const vouchers = build({ events });
    for (const voucher of vouchers) {
      expect(sumOf({ minors: voucher.transactions.map((t) => t.amountMinor) }), voucher.text).toBe(
        0,
      );
    }
    const [sent, voided] = [vouchers[0], vouchers.at(-1)];
    expect(voided?.text).toBe("Void invoice 12, ticket 1045");
    expect(voided?.transactions.map((t) => -t.amountMinor)).toEqual(
      sent?.transactions.map((t) => t.amountMinor),
    );
  });

  it("splits a part payment of a quote pro rata across revenue and VAT", () => {
    const settles = { kind: "QUOTE" as const, parts: [lunch, room] };
    const [voucher] = build({
      events: [{ ...base, kind: "PAYMENT", amountMinor: 405_000, settles }],
    });
    const vat = voucher?.transactions.filter((t) => ["2611", "2621"].includes(t.account));
    expect(vat?.map((t) => t.amountMinor)).toEqual([-30_000, -25_000]);
  });

  it("refuses a VAT rate without an output account instead of rounding it away", () => {
    const sixPercent = { ...lunch, vatRatePercent: 6 };
    const accounts = { ...ACCOUNTS, vatOutput: { 25: "2611", 12: "2621" } };
    const events: AccountingEvent[] = [{ ...invoice, parts: [sixPercent] }];
    expect(errorCode({ result: buildVouchers({ accounts, events }) })).toBe("VALIDATION");
  });
});

const file = ({ vouchers }: { vouchers: SieFile["vouchers"] }): SieFile => ({
  programName: "Bibi",
  programVersion: "1.0",
  generatedOn: "2026-11-01",
  orgNumber: "556000-0000",
  companyName: 'Konferensgården Ö "Södra"',
  fiscalYear: { start: "2026-01-01", end: "2026-12-31" },
  accounts: [{ number: "3001", name: "Försäljning mat" }],
  objects: [{ dimension: 6, id: "1045", name: "Ticket 1045" }],
  vouchers,
});

describe("SIE 4 file (SIE 4B, type 4I)", () => {
  it("writes the header and vouchers as the golden file", () => {
    const vouchers = build({ events: [{ ...base, kind: "FEE", amountMinor: 1_215 }] });
    expect(unwrap({ result: writeSieText({ file: file({ vouchers }) }) })).toBe(
      [
        "#FLAGGA 0",
        '#PROGRAM "Bibi" "1.0"',
        "#FORMAT PC8",
        "#GEN 20261101",
        "#SIETYP 4",
        "#ORGNR 556000-0000",
        '#FNAMN "Konferensgården Ö \\"Södra\\""',
        "#RAR 0 20260101 20261231",
        "#KPTYP BAS2014",
        "#VALUTA SEK",
        '#DIM 6 "Projekt"',
        '#KONTO 3001 "Försäljning mat"',
        '#OBJEKT 6 "1045" "Ticket 1045"',
        '#VER "" "" 20261005 "Payment fee, ticket 1045"',
        "{",
        '   #TRANS 6570 {6 "1045"} 12.15',
        "   #TRANS 1580 {} -12.15",
        "}",
        "",
      ].join("\r\n"),
    );
  });

  it("encodes Swedish letters as codepage 437 and refuses an unbalanced voucher", () => {
    const bytes = encodeCp437({ text: "åäöÅÄÖé€" });
    expect([...bytes]).toEqual([0x86, 0x84, 0x94, 0x8f, 0x8e, 0x99, 0x82, 0x3f]);
    expect(decodeCp437({ bytes })).toBe("åäöÅÄÖé?");
    const off = [
      { date: "2026-10-05", text: "Off", transactions: [{ account: "1510", amountMinor: 1 }] },
    ];
    expect(errorCode({ result: writeSie({ file: file({ vouchers: off }) }) })).toBe("VALIDATION");
    expect([amount({ minor: -5 }), amount({ minor: 123_456 })]).toEqual(["-0.05", "1234.56"]);
  });
});

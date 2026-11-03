import { describe, expect, it } from "vitest";
import { accountsOf, base, build, depositVat, invoice, sumOf } from "./sie4-helpers";

describe("SIE 4 vouchers carry VAT on deposits (ADR 0093)", () => {
  it("books a paid deposit as an advance excl. VAT plus output VAT per rate (ADR 0093)", () => {
    const settles = { kind: "DEPOSIT" as const, ...depositVat };
    const [full, part] = build({
      events: [
        { ...base, kind: "PAYMENT", amountMinor: 100_000, settles },
        { ...base, date: "2026-10-06", kind: "PAYMENT", amountMinor: 50_000, settles },
      ],
    });
    expect(accountsOf({ transactions: full?.transactions ?? [] })).toEqual({
      "1580D": 100_000,
      "2420C": -85_200,
      "2621C": -6_000,
      "2611C": -8_800,
    });
    expect(accountsOf({ transactions: part?.transactions ?? [] })).toEqual({
      "1580D": 50_000,
      "2420C": -42_600,
      "2621C": -3_000,
      "2611C": -4_400,
    });
  });

  it("keeps a deposit without a split on customer advances, without VAT", () => {
    const settles = { kind: "DEPOSIT" as const, parts: [] };
    const [paid, sent] = build({
      events: [
        { ...base, kind: "PAYMENT", amountMinor: 100_000, settles },
        { ...invoice, date: "2026-10-06", deductions: [{ amountMinor: 100_000, parts: [] }] },
      ],
    });
    expect(accountsOf({ transactions: paid?.transactions ?? [] })).toEqual({
      "1580D": 100_000,
      "2420C": -100_000,
    });
    const advances = sent?.transactions.filter((t) => t.account === "2420");
    expect(advances?.map((t) => t.amountMinor)).toEqual([100_000]);
  });

  it("nets customer advances to zero and VAT to the sale's once the invoice deducts the deposit", () => {
    const settles = { kind: "DEPOSIT" as const, ...depositVat };
    const vouchers = build({
      events: [{ ...base, kind: "PAYMENT", amountMinor: 100_000, settles }, invoice],
    });
    const total = ({ account }: { account: string }) =>
      sumOf({
        minors: vouchers
          .flatMap((v) => v.transactions)
          .filter((t) => t.account === account)
          .map((t) => t.amountMinor),
      });
    expect(total({ account: "2420" })).toBe(0);
    expect(total({ account: "2621" })).toBe(-60_000);
    expect(total({ account: "2611" })).toBe(-50_000);
  });
});

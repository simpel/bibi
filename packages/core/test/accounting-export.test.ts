import { afterEach, describe, expect, it } from "vitest";
import {
  createPayment,
  execute,
  listAccountingExports,
  resetProviderAdapters,
  voidInvoice,
} from "../src/index";
import {
  AROUND_NOW,
  download,
  LONG_AGO,
  preview,
  run,
  sentInvoice,
} from "./accounting-export-helpers";
import { errorCode, unwrap } from "./helpers";
import { markSucceeded, moneySetup } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

describe("accounting exports are SIE 4I files of a date range (ADR 0077)", () => {
  it("previews, writes the vouchers and keeps the exact file", async () => {
    const { context, invoice } = await sentInvoice();
    const pay = { invoiceId: invoice.id, method: "CARD" as const };
    const payment = unwrap({
      result: await execute({ operation: createPayment, input: pay, context }),
    });
    await markSucceeded({ context, paymentId: payment.id });
    expect(await preview({ context })).toMatchObject({
      voucherCount: 2,
      earlierExports: 0,
      blockers: [],
    });
    const made = unwrap({ result: await run({ context }) });
    expect(made).toMatchObject({ number: 1, voucherCount: 2, fileName: "bibi-sie-0001.si" });
    expect(made.periodStart).toBeInstanceOf(Date);
    expect(made.periodEnd).toBeInstanceOf(Date);
    const text = await download({ context, id: made.id });
    expect(text).toContain("#ORGNR 556000-0000");
    expect(text).toContain('#FNAMN "Gården AB"');
    expect(text).toContain("#TRANS 1510 {6");
    expect(text).toContain("#TRANS 2621 {6");
    expect(await download({ context, id: made.id })).toBe(text);
    const list = unwrap({
      result: await execute({ operation: listAccountingExports, input: { limit: 10 }, context }),
    });
    expect(list.items.map((row) => row.number)).toEqual([1]);
  });

  it("exports the same range again and warns about the overlap", async () => {
    const { context } = await sentInvoice();
    const first = unwrap({ result: await run({ context }) });
    expect(await preview({ context })).toMatchObject({ voucherCount: 1, earlierExports: 1 });
    const second = unwrap({ result: await run({ context }) });
    expect(second).toMatchObject({ number: 2, voucherCount: 1 });
    expect(await download({ context, id: second.id })).toContain("#TRANS 1510 {6");
    expect(await download({ context, id: first.id })).toContain("#TRANS 1510 {6");
  });

  it("holds only what is dated in the range", async () => {
    const { context } = await sentInvoice();
    expect(await preview({ context, range: LONG_AGO })).toMatchObject({
      voucherCount: 0,
      earlierExports: 0,
    });
    expect(errorCode({ result: await run({ context, range: LONG_AGO }) })).toBe("CONFLICT");
    const backwards = { from: AROUND_NOW.to, to: AROUND_NOW.from };
    expect(errorCode({ result: await run({ context, range: backwards }) })).toBe("VALIDATION");
  });

  it("reverses a voided invoice in the range it was voided in", async () => {
    const { context, invoice } = await sentInvoice();
    unwrap({ result: await run({ context }) });
    unwrap({
      result: await execute({ operation: voidInvoice, input: { id: invoice.id }, context }),
    });
    const both = unwrap({ result: await run({ context }) });
    expect(both.voucherCount).toBe(2);
    const text = await download({ context, id: both.id });
    expect(text).toContain("Void invoice 1");
    expect(text).toMatch(/#TRANS 1510 \{6 "\d+"\} -5600\.00/);
  });

  it("reports a deposit's VAT when paid and reverses it on the invoice (ADR 0093)", async () => {
    const { context } = await sentInvoice({ deposit: 150_000 });
    const text = await download({ context, id: unwrap({ result: await run({ context }) }).id });
    const posted = [...text.matchAll(/#TRANS (\d+) \{[^}]*\} (-?[\d.]+)/g)];
    const total = ({ account }: { account: string }) =>
      posted.filter((m) => m[1] === account).reduce((sum, m) => sum + Number(m[2]) * 100, 0);
    // 1 500 kr at the order's 12 %: 1 339.29 on advances and 160.71 VAT, then reversed.
    expect(text).toMatch(/#TRANS 2420 \{6 "\d+"\} -1339\.29/);
    expect(text).toMatch(/#TRANS 2621 \{6 "\d+"\} -160\.71/);
    expect(Math.round(total({ account: "2420" }))).toBe(0);
    expect(Math.round(total({ account: "2621" }))).toBe(-60_000);
  });

  it("is blocked without an organization number", async () => {
    const { context } = await moneySetup();
    expect((await preview({ context })).blockers.map((b) => b.code)).toEqual([
      "ORG_NUMBER_MISSING",
      "NOTHING_TO_EXPORT",
    ]);
  });
});

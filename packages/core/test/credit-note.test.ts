import { describe, expect, it } from "vitest";
import {
  createInvoice,
  creditInvoice,
  execute,
  getCreditNote,
  listCreditNotes,
  sendInvoice,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";

describe("creditNote.get and creditNote.list (ADR 0100)", () => {
  it("reads credit notes by invoice and by order, newest first, with their lines", async () => {
    const { context, order } = await moneySetup();
    await makeInvoiceable({ context, statusId: order.statusId });
    const draft = unwrap({
      result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
    });
    unwrap({ result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }) });
    for (const amountMinor of [10_000, 20_000]) {
      const input = { invoiceId: draft.id, amountMinor, reason: "Fewer guests" };
      unwrap({ result: await execute({ operation: creditInvoice, input, context }) });
    }
    const byInvoice = unwrap({
      result: await execute({
        operation: listCreditNotes,
        input: { invoiceId: draft.id },
        context,
      }),
    });
    // Newest first; the accounting system numbers them, Bibi does not (ADR 0106).
    expect(byInvoice.items.map((n) => [n.number, n.amountMinor])).toEqual([
      [null, 20_000],
      [null, 10_000],
    ]);
    const first = byInvoice.items[1];
    expect(first).toMatchObject({ orderId: order.id, status: "ISSUED", reason: "Fewer guests" });
    expect(Array.isArray(first?.lines)).toBe(true);
    const page = unwrap({
      result: await execute({
        operation: listCreditNotes,
        input: { orderId: order.id, limit: 1 },
        context,
      }),
    });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
    const one = unwrap({
      result: await execute({ operation: getCreditNote, input: { id: first?.id ?? "" }, context }),
    });
    expect(one).toEqual(first);
    const neither = await execute({ operation: listCreditNotes, input: {}, context });
    expect(errorCode({ result: neither })).toBe("VALIDATION");
    const missing = await execute({ operation: getCreditNote, input: { id: "nope" }, context });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  execute,
  getOrder,
  resetProviderAdapters,
  sendInvoice,
  updateContact,
  updateCustomer,
  updateOrder,
} from "../src/index";
import { unwrap } from "./helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

type Setup = Awaited<ReturnType<typeof moneySetup>>;

async function requireReference({ context, order }: Pick<Setup, "context" | "order">) {
  const input = { id: order.customerId, requiresBuyerReference: true };
  unwrap({ result: await execute({ operation: updateCustomer, input, context }) });
}

async function setContactReference({
  context,
  order,
  buyerReference,
}: Pick<Setup, "context" | "order"> & { buyerReference: string | null }) {
  const input = { id: order.contactId ?? "", buyerReference };
  unwrap({ result: await execute({ operation: updateContact, input, context }) });
}

describe("the buyer's reference on contact, order and invoice (ADR 0105)", () => {
  it("follows the contact until the order sets its own", async () => {
    const { context, order } = await moneySetup();
    await setContactReference({ context, order, buyerReference: "KS-1" });
    const followed = unwrap({
      result: await execute({ operation: getOrder, input: { id: order.id }, context }),
    });
    expect(followed).toMatchObject({
      buyerReference: null,
      effectiveBuyerReference: "KS-1",
      buyerReferenceSource: "CONTACT",
      buyerReferenceMissing: false,
    });
    const own = unwrap({
      result: await execute({
        operation: updateOrder,
        input: { id: order.id, buyerReference: " DNR 2026/14 " },
        context,
      }),
    });
    expect(own).toMatchObject({
      effectiveBuyerReference: "DNR 2026/14",
      buyerReferenceSource: "ORDER",
    });
  });

  it("refuses to invoice a customer that requires a reference without one", async () => {
    const { context, order } = await moneySetup();
    await requireReference({ context, order });
    await makeInvoiceable({ context, statusId: order.statusId });
    const missing = unwrap({
      result: await execute({ operation: getOrder, input: { id: order.id }, context }),
    });
    expect(missing.buyerReferenceMissing).toBe(true);
    const refused = await execute({
      operation: createInvoice,
      input: { orderId: order.id },
      context,
    });
    expect(refused.ok).toBe(false);
    if (refused.ok) return;
    expect(refused.error).toMatchObject({ code: "VALIDATION" });
    expect(JSON.stringify(refused.error)).toContain("buyerReference");
  });

  it("freezes the reference on the invoice when it is created", async () => {
    const { context, order } = await moneySetup();
    await requireReference({ context, order });
    await setContactReference({ context, order, buyerReference: "KS-1" });
    await makeInvoiceable({ context, statusId: order.statusId });
    const invoice = unwrap({
      result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
    });
    expect(invoice.buyerReference).toBe("KS-1");
    await setContactReference({ context, order, buyerReference: "KS-2" });
    const sent = unwrap({
      result: await execute({ operation: sendInvoice, input: { id: invoice.id }, context }),
    });
    expect(sent.buyerReference).toBe("KS-1");
  });
});

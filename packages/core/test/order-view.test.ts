import { afterEach, describe, expect, it } from "vitest";
import {
  type ExecuteContext,
  execute,
  followAssignment,
  resetProviderAdapters,
  viewOrder,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { memberUser } from "./order-helpers";
import { moneySetup, sentTestQuote } from "./receivable-helpers";

afterEach(() => resetProviderAdapters());

type ViewInput = { context: ExecuteContext; id: string };

const view = async ({ context, id }: ViewInput) =>
  unwrap({ result: await execute({ operation: viewOrder, input: { id }, context }) });

/** 20 lunches at 250 kr + 12 % VAT, an accepted quote, Erik assigned and Sara following. */
async function viewSetup() {
  const setup = await moneySetup();
  const { context, order } = setup;
  const sara = await memberUser({ context, name: "Sara Berg" });
  const follow = { subjectType: "ORDER" as const, subjectId: order.id, userId: sara };
  unwrap({ result: await execute({ operation: followAssignment, input: follow, context }) });
  await sentTestQuote({ context, orderId: order.id, accept: true });
  return { ...setup, sara };
}

describe("order.view (ADR 0071, 0097 view read model)", () => {
  it("joins status, customer, people, line totals and balance onto the order", async () => {
    const { context, order, erik, sara, customer } = await viewSetup();
    const status = await context.db.orderStatus.findFirstOrThrow({ where: { id: order.statusId } });
    const result = await view({ context, id: order.id });
    expect(result).toMatchObject({
      id: order.id,
      reference: order.reference,
      guestCount: 20,
      currentStatus: { id: status.id, name: status.name, color: status.color },
      customer: { id: customer.id, name: customer.name },
      assignee: { userId: erik, name: "Erik Lund" },
      followers: [{ userId: sara, name: "Sara Berg" }],
      program: {
        lineCount: 1,
        totalExclVatMinor: 500_000,
        totalInclVatMinor: 560_000,
        totalIsFrom: false,
        issueCount: 0,
      },
      balance: { billedFrom: "QUOTE", billedMinor: 560_000, paidMinor: 0, balanceMinor: 560_000 },
    });
    expect(result.contact?.id).toBe(order.contactId);
  });

  it("hides each joined field without its feature's read", async () => {
    const { context, order, erik } = await viewSetup();
    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { order: ["read"] },
    });
    expect(await view({ context: reader, id: order.id })).toMatchObject({
      id: order.id,
      guestCount: 20,
      currentStatus: null,
      customer: null,
      contact: null,
      assignee: { userId: erik },
      program: null,
      balance: null,
    });
  });

  it("is NOT_FOUND for an unknown id and for another organization's order", async () => {
    const { order } = await viewSetup();
    const other = testContext();
    const foreign = await execute({
      operation: viewOrder,
      input: { id: order.id },
      context: other,
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    const unknown = await execute({ operation: viewOrder, input: { id: "nope" }, context: other });
    expect(errorCode({ result: unknown })).toBe("NOT_FOUND");
  });
});

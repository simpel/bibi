import { afterEach, describe, expect, it } from "vitest";
import {
  createExecuteContext,
  createInvoice,
  createMemoryProvider,
  type ExecuteContext,
  execute,
  getInvoice,
  grantAll,
  resetProviderAdapters,
  retryVoids,
  sendInvoice,
  setProviderAdapter,
  voidInvoice,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

/** A SENT invoice raised at a memory provider with invoicing (Stripe Invoicing's shape). */
async function raisedInvoice() {
  const setup = await moneySetup();
  const { context, order } = setup;
  const fake = createMemoryProvider({
    key: "STRIPE",
    connectKind: "HOSTED_ONBOARDING",
    methods: ["CARD"],
    invoicing: true,
  });
  setProviderAdapter({ key: "STRIPE", adapter: fake.adapter });
  await makeInvoiceable({ context, statusId: order.statusId });
  const draft = unwrap({
    result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
  });
  const invoice = unwrap({
    result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }),
  });
  return { context, fake, invoice };
}

const retry = ({ context, minutes }: { context: ExecuteContext; minutes: number }) => {
  const system = createExecuteContext({
    organizationId: context.organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
  });
  const now = () => new Date(Date.now() + minutes * 60_000);
  return execute({ operation: retryVoids, input: {}, context: { ...system, now } });
};

const read = async ({ context, id }: { context: ExecuteContext; id: string }) =>
  unwrap({ result: await execute({ operation: getInvoice, input: { id }, context }) });

describe("invoice.void at the provider (ADR 0100)", () => {
  it("is SENT again when the provider refuses the void", async () => {
    const { context, fake, invoice } = await raisedInvoice();
    fake.refusing.add("void");
    const refused = await execute({ operation: voidInvoice, input: { id: invoice.id }, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(await read({ context, id: invoice.id })).toMatchObject({
      status: "SENT",
      voidPending: false,
    });
    const row = await context.db.invoice.findFirstOrThrow({ where: { id: invoice.id } });
    expect(row.voidedAt).toBeNull();
  });

  it("stays VOID pending without an answer, and the retry job finishes it", async () => {
    const { context, fake, invoice } = await raisedInvoice();
    fake.failing.add("void");
    const unknown = await execute({ operation: voidInvoice, input: { id: invoice.id }, context });
    expect(errorCode({ result: unknown })).toBe("UNAVAILABLE");
    expect(await read({ context, id: invoice.id })).toMatchObject({
      status: "VOID",
      voidPending: true,
      canVoid: false,
    });
    expect(unwrap({ result: await retry({ context, minutes: 5 }) })).toMatchObject({ due: 0 });
    const done = unwrap({ result: await retry({ context, minutes: 20 }) });
    expect(done).toMatchObject({ due: 1, voided: 1 });
    expect(fake.portCalls).toEqual(["void:1"]);
    expect(await read({ context, id: invoice.id })).toMatchObject({
      status: "VOID",
      voidPending: false,
    });
  });

  it("rolls a pending void back when the retry is refused", async () => {
    const { context, fake, invoice } = await raisedInvoice();
    fake.failing.add("void");
    await execute({ operation: voidInvoice, input: { id: invoice.id }, context });
    fake.refusing.add("void");
    const done = unwrap({ result: await retry({ context, minutes: 20 }) });
    expect(done).toMatchObject({ due: 1, refused: 1 });
    expect(await read({ context, id: invoice.id })).toMatchObject({
      status: "SENT",
      voidPending: false,
    });
    const asUser = await execute({ operation: retryVoids, input: {}, context });
    expect(errorCode({ result: asUser })).toBe("FORBIDDEN");
  });
});

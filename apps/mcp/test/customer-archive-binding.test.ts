import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import {
  addArchiveOrder,
  seedArchiveCustomer,
  setupArchiveClients,
} from "./customer-archive-seed";
import { call } from "./helpers";

type ProposeInput = { assistant: Client; args: Record<string, unknown> };

const propose = ({ assistant, args }: ProposeInput) =>
  call({ client: assistant, name: "customer_archive", args });

const confirm = ({ user, token }: { user: Client; token: string }) =>
  call({ client: user, name: "approval_confirm", args: { approvalToken: token } });

const activeOrders = async ({ user }: { user: Client }) =>
  (await call({ client: user, name: "order_list" })).data.items as { id: string }[];

const orderTypeId = async ({ user }: { user: Client }) => {
  const types = await call({ client: user, name: "entityType_list" });
  return types.data.items.find((type: { base: string }) => type.base === "ORDER").id as string;
};

describe("customer_archive binds the order count server-side (#144)", () => {
  it("signs the current count when the assistant omits it", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, orders: 2 });
    const proposal = await propose({ assistant, args: { id, archiveOrders: true } });
    expect(proposal.data.input).toMatchObject({
      id,
      archiveOrders: true,
      expectedOrderCount: 2,
    });
    expect(proposal.data.summary).toBe('Archive customer "Kvarnby Design AB" and its 2 orders');
  });

  it("replaces a count sent by the assistant with the one in the database", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, orders: 2 });
    const args = { id, archiveOrders: true, expectedOrderCount: 0 };
    const proposal = await propose({ assistant, args });
    expect(proposal.data.input.expectedOrderCount).toBe(2);
    expect(proposal.data.summary).toBe('Archive customer "Kvarnby Design AB" and its 2 orders');
  });

  it("signs no count without archiveOrders, and refuses a customer it cannot read", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, orders: 0 });
    const plain = await propose({ assistant, args: { id, expectedOrderCount: 5 } });
    expect(plain.data.input).not.toHaveProperty("expectedOrderCount");
    const missing = await propose({ assistant, args: { id: "missing", archiveOrders: true } });
    expect(missing.isError).toBe(true);
    expect(missing.data).toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses confirm with CONFLICT when an order was added after the proposal", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, orders: 2 });
    const proposal = await propose({ assistant, args: { id, archiveOrders: true } });
    const entityTypeId = await orderTypeId({ user });
    await addArchiveOrder({ client: user, entityTypeId, customerId: id });
    const confirmed = await confirm({ user, token: proposal.data.approvalToken });
    expect(confirmed.data).toMatchObject({ code: "CONFLICT" });
    expect(await activeOrders({ user })).toHaveLength(3);
    const customer = await call({ client: user, name: "customer_get", args: { id } });
    expect(customer.data).toMatchObject({ id, status: "ACTIVE", orderCount: 3 });
  });

  it("archives exactly the bound orders when nothing changed", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, orders: 2 });
    const before = await activeOrders({ user });
    const proposal = await propose({ assistant, args: { id, archiveOrders: true } });
    const confirmed = await confirm({ user, token: proposal.data.approvalToken });
    expect(confirmed.data).toMatchObject({ id, status: "ARCHIVED", orderCount: 0 });
    expect(before).toHaveLength(2);
    expect(await activeOrders({ user })).toEqual([]);
  });
});

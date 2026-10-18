import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import {
  addArchiveTicket,
  seedArchiveCustomer,
  setupArchiveClients,
} from "./customer-archive-seed";
import { call } from "./helpers";

type ProposeInput = { assistant: Client; args: Record<string, unknown> };

const propose = ({ assistant, args }: ProposeInput) =>
  call({ client: assistant, name: "customer_archive", args });

const confirm = ({ user, token }: { user: Client; token: string }) =>
  call({ client: user, name: "approval_confirm", args: { approvalToken: token } });

const activeTickets = async ({ user }: { user: Client }) =>
  (await call({ client: user, name: "ticket_list" })).data.items as { id: string }[];

const ticketTypeId = async ({ user }: { user: Client }) => {
  const types = await call({ client: user, name: "entityType_list" });
  return types.data.items.find((type: { base: string }) => type.base === "TICKET").id as string;
};

describe("customer_archive binds the ticket count server-side (#144)", () => {
  it("signs the current count when the assistant omits it", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, tickets: 2 });
    const proposal = await propose({ assistant, args: { id, archiveTickets: true } });
    expect(proposal.data.input).toMatchObject({
      id,
      archiveTickets: true,
      expectedTicketCount: 2,
    });
    expect(proposal.data.summary).toBe('Archive customer "Kvarnby Design AB" and its 2 tickets');
  });

  it("replaces a count sent by the assistant with the one in the database", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, tickets: 2 });
    const args = { id, archiveTickets: true, expectedTicketCount: 0 };
    const proposal = await propose({ assistant, args });
    expect(proposal.data.input.expectedTicketCount).toBe(2);
    expect(proposal.data.summary).toBe('Archive customer "Kvarnby Design AB" and its 2 tickets');
  });

  it("signs no count without archiveTickets, and refuses a customer it cannot read", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, tickets: 0 });
    const plain = await propose({ assistant, args: { id, expectedTicketCount: 5 } });
    expect(plain.data.input).not.toHaveProperty("expectedTicketCount");
    const missing = await propose({ assistant, args: { id: "missing", archiveTickets: true } });
    expect(missing.isError).toBe(true);
    expect(missing.data).toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses confirm with CONFLICT when a ticket was added after the proposal", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, tickets: 2 });
    const proposal = await propose({ assistant, args: { id, archiveTickets: true } });
    const entityTypeId = await ticketTypeId({ user });
    await addArchiveTicket({ client: user, entityTypeId, customerId: id });
    const confirmed = await confirm({ user, token: proposal.data.approvalToken });
    expect(confirmed.data).toMatchObject({ code: "CONFLICT" });
    expect(await activeTickets({ user })).toHaveLength(3);
    const customer = await call({ client: user, name: "customer_get", args: { id } });
    expect(customer.data).toMatchObject({ id, status: "ACTIVE", ticketCount: 3 });
  });

  it("archives exactly the bound tickets when nothing changed", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, tickets: 2 });
    const before = await activeTickets({ user });
    const proposal = await propose({ assistant, args: { id, archiveTickets: true } });
    const confirmed = await confirm({ user, token: proposal.data.approvalToken });
    expect(confirmed.data).toMatchObject({ id, status: "ARCHIVED", ticketCount: 0 });
    expect(before).toHaveLength(2);
    expect(await activeTickets({ user })).toEqual([]);
  });
});

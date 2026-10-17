import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import {
  addArchiveBooking,
  seedArchiveCustomer,
  setupArchiveClients,
} from "./customer-archive-seed";
import { call } from "./helpers";

type ProposeInput = { assistant: Client; args: Record<string, unknown> };

const propose = ({ assistant, args }: ProposeInput) =>
  call({ client: assistant, name: "customer_archive", args });

const confirm = ({ user, token }: { user: Client; token: string }) =>
  call({ client: user, name: "approval_confirm", args: { approvalToken: token } });

const activeBookings = async ({ user }: { user: Client }) =>
  (await call({ client: user, name: "booking_list" })).data.items as { id: string }[];

const bookingTypeId = async ({ user }: { user: Client }) => {
  const types = await call({ client: user, name: "entityType_list" });
  return types.data.items.find((type: { base: string }) => type.base === "BOOKING").id as string;
};

describe("customer_archive binds the booking count server-side (#144)", () => {
  it("signs the current count when the assistant omits it", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, bookings: 2 });
    const proposal = await propose({ assistant, args: { id, archiveBookings: true } });
    expect(proposal.data.input).toMatchObject({
      id,
      archiveBookings: true,
      expectedBookingCount: 2,
    });
    expect(proposal.data.summary).toBe('Archive customer "Kvarnby Design AB" and its 2 bookings');
  });

  it("replaces a count sent by the assistant with the one in the database", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, bookings: 2 });
    const args = { id, archiveBookings: true, expectedBookingCount: 0 };
    const proposal = await propose({ assistant, args });
    expect(proposal.data.input.expectedBookingCount).toBe(2);
    expect(proposal.data.summary).toBe('Archive customer "Kvarnby Design AB" and its 2 bookings');
  });

  it("signs no count without archiveBookings, and refuses a customer it cannot read", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, bookings: 0 });
    const plain = await propose({ assistant, args: { id, expectedBookingCount: 5 } });
    expect(plain.data.input).not.toHaveProperty("expectedBookingCount");
    const missing = await propose({ assistant, args: { id: "missing", archiveBookings: true } });
    expect(missing.isError).toBe(true);
    expect(missing.data).toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses confirm with CONFLICT when a booking was added after the proposal", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, bookings: 2 });
    const proposal = await propose({ assistant, args: { id, archiveBookings: true } });
    const entityTypeId = await bookingTypeId({ user });
    await addArchiveBooking({ client: user, entityTypeId, customerId: id });
    const confirmed = await confirm({ user, token: proposal.data.approvalToken });
    expect(confirmed.data).toMatchObject({ code: "CONFLICT" });
    expect(await activeBookings({ user })).toHaveLength(3);
    const customer = await call({ client: user, name: "customer_get", args: { id } });
    expect(customer.data).toMatchObject({ id, status: "ACTIVE", bookingCount: 3 });
  });

  it("archives exactly the bound bookings when nothing changed", async () => {
    const { user, assistant } = await setupArchiveClients();
    const id = await seedArchiveCustomer({ client: user, bookings: 2 });
    const before = await activeBookings({ user });
    const proposal = await propose({ assistant, args: { id, archiveBookings: true } });
    const confirmed = await confirm({ user, token: proposal.data.approvalToken });
    expect(confirmed.data).toMatchObject({ id, status: "ARCHIVED", bookingCount: 0 });
    expect(before).toHaveLength(2);
    expect(await activeBookings({ user })).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  seedArchiveCustomer as seedCustomer,
  setupArchiveClients as setup,
} from "./customer-archive-seed";
import { call } from "./helpers";

describe("customer_archive approval (#134)", () => {
  it("says how many bookings will be archived and archives them once approved", async () => {
    const { user, assistant } = await setup();
    const id = await seedCustomer({ client: user, bookings: 3 });
    const blocked = await call({ client: user, name: "customer_archive", args: { id } });
    expect(blocked.data).toMatchObject({ code: "CONFLICT", issues: [{ path: "archiveBookings" }] });
    const proposal = await call({
      client: assistant,
      name: "customer_archive",
      args: { id, archiveBookings: true },
    });
    expect(proposal.data).toMatchObject({
      status: "approval_required",
      summary: 'Archive customer "Kvarnby Design AB" and its 3 bookings',
    });
    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.data).toMatchObject({ id, status: "ARCHIVED", bookingCount: 0 });
    expect((await call({ client: user, name: "booking_list" })).data.items).toEqual([]);
  });
});

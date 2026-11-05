import { describe, expect, it } from "vitest";
import {
  seedArchiveCustomer as seedCustomer,
  setupArchiveClients as setup,
} from "./customer-archive-seed";
import { call } from "./helpers";

describe("customer_archive approval (#134)", () => {
  it("says how many orders will be archived and archives them once approved", async () => {
    const { user, assistant } = await setup();
    const id = await seedCustomer({ client: user, orders: 3 });
    const blocked = await call({ client: user, name: "customer_archive", args: { id } });
    expect(blocked.data).toMatchObject({ code: "CONFLICT", issues: [{ path: "archiveOrders" }] });
    const proposal = await call({
      client: assistant,
      name: "customer_archive",
      args: { id, archiveOrders: true },
    });
    expect(proposal.data).toMatchObject({
      status: "approval_required",
      summary: 'Archive customer "Kvarnby Design AB" and its 3 orders',
    });
    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.data).toMatchObject({ id, status: "ARCHIVED", orderCount: 0 });
    expect((await call({ client: user, name: "order_list" })).data.items).toEqual([]);
  });
});

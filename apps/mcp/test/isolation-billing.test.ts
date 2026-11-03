import { createMemoryBillingGateway, setBillingGateway } from "@bibi/core";
import { afterEach, describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedOrgMember } from "./seed-org-member";

afterEach(() => setBillingGateway({ gateway: undefined }));

describe("cross-organization isolation: billing", () => {
  it("keeps one organization's subscription and held invitations from another", async () => {
    setBillingGateway({ gateway: createMemoryBillingGateway() });
    const contextA = testContext();
    const contextB = testContext();
    await seedOrgMember({ context: contextA });
    await seedOrgMember({ context: contextB });
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });

    await call({ client: a, name: "billing_update", args: { autoAssignSeats: false } });
    const invited = await call({
      client: a,
      name: "member_invite",
      args: { email: "held@x.test", role: "member" },
    });
    await contextA.db.invitation.update({
      where: { id: invited.data.id },
      data: { status: "held" },
    });

    const own = await call({ client: a, name: "billing_listSeatRequests" });
    expect(own.data.items.map((item: { id: string }) => item.id)).toEqual([invited.data.id]);
    expect((await call({ client: b, name: "billing_listSeatRequests" })).data.items).toEqual([]);

    const billingA = await call({ client: a, name: "billing_get" });
    const billingB = await call({ client: b, name: "billing_get" });
    expect(billingA.data.organizationId).toBe(contextA.organizationId);
    expect(billingA.data.seats.held).toBe(1);
    expect(billingB.data.organizationId).toBe(contextB.organizationId);
    expect(billingB.data.id).toBeNull();
    expect(billingB.data.seats.held).toBe(0);
    expect((await call({ client: b, name: "billing_access" })).isError).toBe(false);

    for (const name of ["billing_approveSeat", "billing_rejectSeat"]) {
      const refused = await call({ client: b, name, args: { id: invited.data.id } });
      expect(refused.data.code, name).toBe("NOT_FOUND");
    }
    // B's own billing commands touch only B.
    for (const name of ["billing_sync", "billing_remindAdmins"]) {
      const result = await call({ client: b, name });
      expect(result.data.organizationId ?? contextB.organizationId, name).toBe(
        contextB.organizationId,
      );
    }
    await call({ client: b, name: "billing_startCheckout", args: { interval: "MONTH" } });
    await call({ client: b, name: "billing_openPortal", args: {} });
    expect((await call({ client: a, name: "billing_listSeatRequests" })).data.items).toHaveLength(
      1,
    );
  });
});

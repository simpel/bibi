import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type Client = Awaited<ReturnType<typeof connect>>;

const idsOf = async ({ client }: { client: Client }) =>
  (await call({ client, name: "notification_list", args: {} })).data.items.map(
    (item: { id: string }) => item.id,
  );

describe("notification isolation (ADR 0094)", () => {
  it("keeps each member's notifications private, in the same and in other organizations", async () => {
    const contextA = testContext({ access: "read" });
    const a = await connect({ context: contextA });
    const row = await getDb().notification.create({
      data: {
        organizationId: contextA.organizationId,
        recipientUserId: contextA.actor.userId ?? "",
        kind: "ASSIGNED",
      },
    });
    const sameOrgAdmin = await connect({
      context: testContext({ organizationId: contextA.organizationId }),
    });
    const otherOrg = await connect({
      context: testContext({ actor: { type: "user", userId: contextA.actor.userId ?? "" } }),
    });
    expect(await idsOf({ client: a })).toEqual([row.id]);
    for (const client of [sameOrgAdmin, otherOrg]) {
      expect(await idsOf({ client })).toEqual([]);
      for (const name of ["notification_markRead", "notification_markUnread"]) {
        const result = await call({ client, name, args: { ids: [row.id] } });
        expect(result.data.updated).toBe(0);
      }
      const all = await call({ client, name: "notification_markAllRead", args: {} });
      expect(all.data.updated).toBe(0);
      const count = await call({ client, name: "notification_unreadCount", args: {} });
      expect(count.data.unread).toBe(0);
    }
    expect(
      (await call({ client: a, name: "notification_unreadCount", args: {} })).data.unread,
    ).toBe(1);
  });

  it("keeps each member's notification choices to themselves", async () => {
    const contextA = testContext({ access: "read" });
    const a = await connect({ context: contextA });
    const b = await connect({ context: testContext({ organizationId: contextA.organizationId }) });
    const set = { kind: "ASSIGNED", enabled: false };
    await call({ client: a, name: "notificationPreference_set", args: set });
    const kindOf = async ({ client }: { client: Client }) =>
      (await call({ client, name: "notificationPreference_list", args: {} })).data.items.find(
        (item: { kind: string }) => item.kind === "ASSIGNED",
      ).enabled;
    expect(await kindOf({ client: a })).toBe(false);
    expect(await kindOf({ client: b })).toBe(true);
  });
});

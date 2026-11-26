import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const TURN_TIMES = [{ upToParty: 4, minutes: 90 }];

/** A room with a layout and a sitting in the client's organization. */
async function seedDining({ client, slug }: { client: Client; slug: string }) {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret dining room", capabilities: ["BOOKABLE", "SETUPS"] },
  });
  const room = await call({
    client,
    name: "item_create",
    args: { entityTypeId: type.data.id, name: "Secret salon" },
  });
  expect(room.isError, JSON.stringify(room.data)).toBe(false);
  const itemId = room.data.id as string;
  const layout = await call({
    client,
    name: "layout_create",
    args: { itemId, name: "Secret tables" },
  });
  expect(layout.isError, JSON.stringify(layout.data)).toBe(false);
  const layoutId = layout.data.id as string;
  const set = await call({ client, name: "diningRoom_set", args: { itemId, slug } });
  expect(set.isError, JSON.stringify(set.data)).toBe(false);
  const service = await call({
    client,
    name: "diningService_create",
    args: {
      roomItemId: itemId,
      name: "Secret dinner",
      layoutId,
      weekdays: [0, 1, 2],
      firstStartMinute: 1020,
      lastStartMinute: 1260,
      turnTimes: TURN_TIMES,
    },
  });
  expect(service.isError, JSON.stringify(service.data)).toBe(false);
  return { itemId, layoutId, serviceId: service.data.id as string };
}

describe("cross-organization isolation: table booking setup (ADR 0119)", () => {
  it("refuses another organization's rooms, sittings, exceptions and layouts", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedDining({ client: a, slug: "secret-salon" });
    const { itemId, layoutId, serviceId } = secret;
    const date = "2037-11-02";

    await call({
      client: a,
      name: "diningServiceException_set",
      args: { serviceId, date, closed: true },
    });

    for (const [name, args] of [
      ["diningRoom_get", { itemId }],
      ["diningRoom_set", { itemId, slug: "intruder" }],
      ["diningService_get", { id: serviceId }],
      ["diningService_update", { id: serviceId, name: "Hijacked" }],
      ["diningService_archive", { id: serviceId }],
      ["diningServiceException_list", { serviceId }],
      ["diningServiceException_set", { serviceId, date, closed: false }],
      ["diningServiceException_delete", { serviceId, date }],
      ["tableCombination_list", { layoutId }],
      ["tableCombination_save", { layoutId, combinations: [] }],
    ] as const) {
      const result = await call({ client: b, name, args });
      expect(["NOT_FOUND", "VALIDATION"], `${name}: ${JSON.stringify(result.data)}`).toContain(
        result.data.code,
      );
    }

    const created = await call({
      client: b,
      name: "diningService_create",
      args: {
        roomItemId: itemId,
        name: "Intruder",
        layoutId,
        weekdays: [0],
        firstStartMinute: 1020,
        lastStartMinute: 1260,
        turnTimes: TURN_TIMES,
      },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(created.data.code);

    const rooms = await call({ client: b, name: "diningRoom_list", args: {} });
    expect(rooms.data.items).toEqual([]);
    const services = await call({ client: b, name: "diningService_list", args: {} });
    expect(services.data.items).toEqual([]);
    const page = await call({ client: b, name: "bookingPage_get", args: {} });
    expect(page.data.slug).toBeNull();

    const own = await call({ client: a, name: "diningService_get", args: { id: serviceId } });
    expect(own.data.name, "A's sitting is unchanged").toBe("Secret dinner");
    expect(own.data.status).toBe("ACTIVE");
    const exceptions = await call({
      client: a,
      name: "diningServiceException_list",
      args: { serviceId },
    });
    expect(exceptions.data.items).toHaveLength(1);
  });

  it("keeps the booking page per organization", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const set = await call({
      client: a,
      name: "bookingPage_update",
      args: { slug: `secret-${Date.now().toString(36)}`, published: true },
    });
    expect(set.isError, JSON.stringify(set.data)).toBe(false);
    const seen = await call({ client: b, name: "bookingPage_get", args: {} });
    expect(seen.data.slug).toBeNull();
    expect(seen.data.published).toBe(false);
    await call({ client: b, name: "bookingPage_update", args: { published: false } });
    const own = await call({ client: a, name: "bookingPage_get", args: {} });
    expect(own.data.slug).toBe(set.data.slug);
    expect(own.data.published, "B left A's page published").toBe(true);
  });
});

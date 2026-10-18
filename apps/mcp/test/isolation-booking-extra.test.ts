import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedBooking } from "./seed-booking";

const times = { startsAt: "2026-11-03T08:00:00.000Z", endsAt: "2026-11-03T16:00:00.000Z" };

async function typeOf({
  client,
  base,
}: {
  client: Awaited<ReturnType<typeof connect>>;
  base: string;
}) {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base, name: `Own ${base}` },
  });
  return type.data.id as string;
}

describe("cross-organization isolation: booking creation", () => {
  it("refuses booking.create and booking.createQuick with another organization's ids", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedBooking({ client: a });
    const bookingType = await typeOf({ client: b, base: "BOOKING" });
    const programType = await typeOf({ client: b, base: "PROGRAM_ITEM" });
    const created = await call({
      client: b,
      name: "booking_create",
      args: { entityTypeId: bookingType, customerId: secret.customerId, ...times },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(created.data.code);
    const quick = await call({
      client: b,
      name: "booking_createQuick",
      args: {
        entityTypeId: bookingType,
        programItemTypeId: programType,
        customerId: secret.customerId,
        itemId: secret.entityTypeId,
        quantity: 4,
        paymentMethod: "INVOICE",
        ...times,
      },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(quick.data.code);
    expect((await call({ client: b, name: "booking_list" })).data.items).toEqual([]);
    expect((await call({ client: a, name: "booking_list" })).data.items).toHaveLength(1);
  });
});

describe("cross-organization isolation: booking statuses and audit log", () => {
  it("hides booking statuses from another organization", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const created = await call({
      client: a,
      name: "bookingStatus_create",
      args: { name: "Secret status", color: "#22c55e", phase: "TENTATIVE" },
    });
    const id = created.data.id as string;
    for (const [name, args] of [
      ["bookingStatus_update", { id, name: "Hijacked" }],
      ["bookingStatus_archive", { id }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const ownB = await call({
      client: b,
      name: "bookingStatus_create",
      args: { name: "Own status", color: "#3b82f6", phase: "TENTATIVE" },
    });
    for (const ids of [[id], [ownB.data.id, id]]) {
      const reorder = await call({ client: b, name: "bookingStatus_reorder", args: { ids } });
      expect(reorder.data.code, JSON.stringify(ids)).toBe("VALIDATION");
    }
    const keep = await call({
      client: b,
      name: "bookingStatus_reorder",
      args: { ids: [ownB.data.id] },
    });
    expect(keep.isError, JSON.stringify(keep.data)).toBe(false);
    const imported = await call({
      client: b,
      name: "bookingStatus_importTemplate",
      args: { template: "default" },
    });
    expect(imported.isError, JSON.stringify(imported.data)).toBe(false);
    const listedA = await call({ client: a, name: "bookingStatus_list" });
    const names = listedA.data.items.map((item: { name: string }) => item.name);
    expect(names).toEqual(["Secret status"]);
    const listedB = await call({ client: b, name: "bookingStatus_list" });
    expect(listedB.data.items.map((item: { id: string }) => item.id)).not.toContain(id);
    const own = await call({ client: a, name: "bookingStatus_get", args: { id } });
    expect(own.data.name).toBe("Secret status");
  });

  it("hides audit log entries from another organization", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await seedBooking({ client: a });
    const listed = await call({ client: a, name: "auditLog_list" });
    const id = listed.data.items[0].id as string;
    expect((await call({ client: b, name: "auditLog_get", args: { id } })).data.code).toBe(
      "NOT_FOUND",
    );
    expect((await call({ client: b, name: "auditLog_list" })).data.items).toEqual([]);
    expect((await call({ client: a, name: "auditLog_get", args: { id } })).data.id).toBe(id);
  });
});

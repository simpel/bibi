import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";
import { seedTicket } from "./seed-ticket";

const times = { startsAt: "2026-11-03T12:00:00.000Z", endsAt: "2026-11-03T16:00:00.000Z" };

type Client = Awaited<ReturnType<typeof connect>>;

/** A bundle item with one part, the given item. */
async function seedBundle({ client, partId }: { client: Client; partId: string }) {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret bundle", capabilities: ["PRICED", "BUNDLE"] },
  });
  const bundle = await call({
    client,
    name: "item_create",
    args: { entityTypeId: type.data.id, name: "Secret day", parts: [{ itemId: partId }] },
  });
  expect(bundle.isError, JSON.stringify(bundle.data)).toBe(false);
  return bundle.data.id as string;
}

describe("cross-organization isolation: bundle expansion (ADR 0059)", () => {
  it("refuses another organization's ticket or bundle and lists none of its part lines", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { ticketId, itemId, programTypeId } = await seedProgram({ client: a });
    const bundleId = await seedBundle({ client: a, partId: itemId });
    const own = await call({
      client: a,
      name: "line_expandBundle",
      args: { ticketId, entityTypeId: programTypeId, itemId: bundleId, ...times },
    });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    const bundleLineId = own.data.items[0].id as string;

    const { id: ticketB } = await seedTicket({ client: b });
    const typeB = await call({
      client: b,
      name: "entityType_create",
      args: { base: "LINE", name: "Own session" },
    });
    for (const args of [
      { ticketId, entityTypeId: typeB.data.id, itemId: bundleId, ...times },
      { ticketId: ticketB, entityTypeId: typeB.data.id, itemId: bundleId, ...times },
      { ticketId: ticketB, entityTypeId: programTypeId, itemId: bundleId, ...times },
    ]) {
      const expanded = await call({ client: b, name: "line_expandBundle", args });
      expect(["NOT_FOUND", "VALIDATION"], JSON.stringify(args)).toContain(expanded.data.code);
    }
    const listed = await call({
      client: b,
      name: "line_list",
      args: { parentLineId: bundleLineId },
    });
    expect(listed.data.items).toEqual([]);
    const parts = await call({
      client: a,
      name: "line_list",
      args: { parentLineId: bundleLineId },
    });
    expect(parts.data.items.map((line: { itemId: string }) => line.itemId)).toEqual([itemId]);
  });
});

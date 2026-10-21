import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedTicket } from "./seed-ticket";

type Client = Awaited<ReturnType<typeof connect>>;

async function ok({ client, name, args }: { client: Client; name: string; args: object }) {
  const result = await call({ client, name, args: args as Record<string, unknown> });
  expect(result.isError, `${name}: ${JSON.stringify(result.data)}`).toBe(false);
  return result.data;
}

/** A ticket with one line for an item offering one option ("Secret technician"). */
async function seedOptions({ client }: { client: Client }) {
  const { id: ticketId } = await seedTicket({ client });
  const base = "ITEM";
  const service = await ok({ client, name: "entityType_create", args: { base, name: "Svc" } });
  const option = await ok({
    client,
    name: "item_create",
    args: { entityTypeId: service.id, name: "Secret technician" },
  });
  const capabilities = ["CUSTOMISATIONS"];
  const roomType = await ok({
    client,
    name: "entityType_create",
    args: { base, name: "Secret projector", capabilities },
  });
  const options = [{ itemId: option.id, priceEffect: "EXTRA" }];
  const customisationGroups = [{ name: "Installation", minPick: 0, maxPick: 1, options }];
  const item = await ok({
    client,
    name: "item_create",
    args: { entityTypeId: roomType.id, name: "Projector", customisationGroups },
  });
  const lineType = await ok({
    client,
    name: "entityType_create",
    args: { base: "LINE", name: "Secret session" },
  });
  const line = await ok({
    client,
    name: "line_create",
    args: { ticketId, entityTypeId: lineType.id, name: "Hidden", itemId: item.id },
  });
  return { lineId: line.id as string, optionId: option.id as string };
}

describe("cross-organization isolation: line options (ADR 0059)", () => {
  it("refuses another organization's line and its options", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedOptions({ client: a });
    const own = await seedOptions({ client: b });
    const foreignLine = await call({
      client: b,
      name: "line_chooseOptions",
      args: { lineId: secret.lineId, optionItemIds: [secret.optionId] },
    });
    expect(foreignLine.data.code).toBe("NOT_FOUND");
    const foreignOption = await call({
      client: b,
      name: "line_chooseOptions",
      args: { lineId: own.lineId, optionItemIds: [secret.optionId] },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(foreignOption.data.code);
    const untouched = await call({
      client: a,
      name: "line_list",
      args: { parentLineId: secret.lineId },
    });
    expect(untouched.data.items).toEqual([]);
  });
});

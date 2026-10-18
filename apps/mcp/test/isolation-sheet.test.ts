import { describe, expect, it } from "vitest";
import { call, connect, type Json, testContext } from "./helpers";
import { seedBooking } from "./seed-booking";

type Client = Awaited<ReturnType<typeof connect>>;
type SeedInput = { client: Client };

async function seedSheet({ client }: SeedInput): Promise<Json> {
  const booking = await seedBooking({ client });
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret room" },
  });
  const definition = await call({
    client,
    name: "sheetDefinition_create",
    args: { name: "Secret sheet", entityTypeIds: [type.data.id], roleId: "owner" },
  });
  expect(definition.isError, JSON.stringify(definition.data)).toBe(false);
  const sheet = await call({
    client,
    name: "sheet_generate",
    args: { bookingId: booking.id, sheetDefinitionId: definition.data.id },
  });
  expect(sheet.isError, JSON.stringify(sheet.data)).toBe(false);
  return { booking, definition: definition.data, sheet: sheet.data };
}

describe("cross-organization isolation: sheets and sheet definitions", () => {
  it("refuses sheet and sheet definition operations on another organization's rows", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { booking, definition, sheet } = await seedSheet({ client: a });
    const mine = await seedSheet({ client: b });
    const cases = [
      ["sheet_get", { id: sheet.id }],
      ["sheet_send", { id: sheet.id }],
      ["sheet_generate", { bookingId: booking.id, sheetDefinitionId: mine.definition.id }],
      ["sheet_generate", { bookingId: mine.booking.id, sheetDefinitionId: definition.id }],
      ["sheetDefinition_update", { id: definition.id, name: "Hacked" }],
      ["sheetDefinition_archive", { id: definition.id }],
    ] as const;
    for (const [name, args] of cases) {
      const result = await call({ client: b, name, args });
      expect(result.isError, name).toBe(true);
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const sheets = await call({ client: b, name: "sheet_list" });
    expect(sheets.data.items.map((item: { id: string }) => item.id)).toEqual([mine.sheet.id]);
    const filtered = await call({ client: b, name: "sheet_list", args: { bookingId: booking.id } });
    expect(filtered.data.items).toEqual([]);
    const definitions = await call({ client: b, name: "sheetDefinition_list" });
    const ids = definitions.data.items.map((item: { id: string }) => item.id);
    expect(ids).toEqual([mine.definition.id]);
  });

  it("leaves the owning organization's sheet and definition untouched", async () => {
    const a = await connect({ context: testContext() });
    const { definition, sheet } = await seedSheet({ client: a });
    const own = await call({ client: a, name: "sheet_get", args: { id: sheet.id } });
    expect(own.data.version).toBe(1);
    expect(own.data.sentAt).toBeNull();
    const list = await call({ client: a, name: "sheetDefinition_list" });
    expect(list.data.items.map((item: { id: string }) => item.id)).toEqual([definition.id]);
    const fetched = await call({
      client: a,
      name: "sheetDefinition_get",
      args: { id: definition.id },
    });
    expect(fetched.data.name).toBe("Secret sheet");
    expect(fetched.data.status).toBe("ACTIVE");
  });
});

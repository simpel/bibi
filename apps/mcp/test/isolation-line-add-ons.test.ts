import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

describe("cross-organization isolation: add-ons (ADR 0088)", () => {
  it("refuses another organization's line as the parent of an add-on", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { lineId: parentLineId } = await seedProgram({ client: a });
    const own = await seedProgram({ client: b });

    const created = await call({
      client: b,
      name: "line_create",
      args: { ticketId: own.ticketId, parentLineId, name: "Intruder add-on" },
    });
    expect(created.data.code).toBe("NOT_FOUND");

    const listed = await call({ client: a, name: "line_list", args: { parentLineId } });
    expect(listed.data.items).toEqual([]);
    const addOn = await call({
      client: b,
      name: "line_create",
      args: { ticketId: own.ticketId, parentLineId: own.lineId, name: "Projector" },
    });
    expect(addOn.data.role).toBe("ADD_ON");
    expect(addOn.data.parentLineId).toBe(own.lineId);
  });
});

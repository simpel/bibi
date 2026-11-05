import { describe, expect, it } from "vitest";
import {
  archiveVenue,
  createVenue,
  type ExecuteContext,
  execute,
  listVenueHours,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { OFFICE_DAYS, runVenueHours } from "./hours-helpers";
import { orderSetup } from "./order-helpers";

type VenueInput = { context: ExecuteContext; name: string; timeZone: string };

async function venue({ context, name, timeZone }: VenueInput) {
  const input = { name, timeZone };
  return unwrap({ result: await execute({ operation: createVenue, input, context }) });
}

const list = async ({ context, venueIds }: { context: ExecuteContext; venueIds: string[] }) =>
  unwrap({ result: await execute({ operation: listVenueHours, input: { venueIds }, context }) });

describe("venue.hoursList (ADR 0097)", () => {
  it("reads several venues' hours in the order given, each in its own zone", async () => {
    const { context } = await orderSetup();
    const harbour = await venue({ context, name: "Harbour", timeZone: "Europe/London" });
    const manor = await venue({ context, name: "Manor", timeZone: "Europe/Stockholm" });
    unwrap({ result: await runVenueHours({ context, venueId: harbour.id, days: OFFICE_DAYS }) });
    const { items } = await list({ context, venueIds: [manor.id, harbour.id, manor.id] });
    expect(items).toEqual([
      { venueId: manor.id, hours: { days: [], exceptions: [], timeZone: "Europe/Stockholm" } },
      {
        venueId: harbour.id,
        hours: { days: OFFICE_DAYS, exceptions: [], timeZone: "Europe/London" },
      },
    ]);
  });

  it("leaves out unknown, archived and other organizations' venues", async () => {
    const { context } = await orderSetup();
    const harbour = await venue({ context, name: "Harbour", timeZone: "Europe/London" });
    const gone = await venue({ context, name: "Gone", timeZone: "Europe/London" });
    unwrap({ result: await execute({ operation: archiveVenue, input: { id: gone.id }, context }) });
    const venueIds = [harbour.id, gone.id, "nope"];
    expect((await list({ context, venueIds })).items.map((item) => item.venueId)).toEqual([
      harbour.id,
    ]);
    expect(await list({ context: testContext(), venueIds })).toEqual({ items: [] });
  });
});

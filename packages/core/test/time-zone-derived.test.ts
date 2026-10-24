import { describe, expect, it } from "vitest";
import {
  applyOverrides,
  createVenue,
  execute,
  getItem,
  getVenue,
  listLines,
  updateItem,
  updateOrganizationProfile,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestLine, programSetup } from "./line-helpers";

const NEW_YORK = "America/New_York";

/** A manager whose `venue:read` an admin denied (ADR 0050). */
const withoutVenueRead = ({ organizationId }: { organizationId: string }) =>
  testContext({
    organizationId,
    permissions: applyOverrides({
      preset: "manager",
      overrides: [{ feature: "venue", action: "read", effect: "deny" }],
    }),
  });

describe("derived time zones on items and lines (ADR 0064)", () => {
  it("gives the item's and line's zone to a caller who may not read venues", async () => {
    const { context, ticket, type, room } = await programSetup();
    const input = { name: "Brygghuset", timeZone: NEW_YORK };
    const venue = unwrap({ result: await execute({ operation: createVenue, input, context }) });
    const moved = { id: room.id, venueId: venue.id };
    unwrap({ result: await execute({ operation: updateItem, input: moved, context }) });
    const line = { context, ticketId: ticket.id, entityTypeId: type.id };
    unwrap({ result: await createTestLine({ ...line, from: 8, to: 10, itemId: room.id }) });
    unwrap({ result: await createTestLine({ ...line, from: 11, to: 12 }) });
    const zone = { timeZone: "Europe/Helsinki" };
    unwrap({
      result: await execute({ operation: updateOrganizationProfile, input: zone, context }),
    });

    const caller = withoutVenueRead({ organizationId: context.organizationId });
    const denied = await execute({ operation: getVenue, input: { id: venue.id }, context: caller });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    const item = unwrap({
      result: await execute({ operation: getItem, input: { id: room.id }, context: caller }),
    });
    expect(item.timeZone).toBe(NEW_YORK);
    const lines = unwrap({
      result: await execute({
        operation: listLines,
        input: { ticketId: ticket.id, limit: 10 },
        context: caller,
      }),
    });
    const zoneOf = ({ itemId }: { itemId: string | null }) =>
      lines.items.find((candidate) => candidate.itemId === itemId)?.timeZone;
    expect(zoneOf({ itemId: room.id })).toBe(NEW_YORK);
    expect(zoneOf({ itemId: null })).toBe("Europe/Helsinki");
  });
});

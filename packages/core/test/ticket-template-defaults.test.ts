import { describe, expect, it } from "vitest";
import {
  createTicketFromTemplate,
  createTicketTemplate,
  type ExecuteContext,
  execute,
  listEntityTypes,
  previewTicketLines,
  updateItem,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { optionsSetup } from "./line-options-helpers";
import { partyOf } from "./ticket-helpers";

const startsAt = new Date(Date.UTC(2037, 10, 2, 9));

type Setup = Awaited<ReturnType<typeof optionsSetup>>;

/** A package with one line for the room that preselects `options`. */
async function makePackage({ setup, options }: { setup: Setup; options: { itemId: string }[] }) {
  const { context, room, lineType, ticket } = setup;
  const types = unwrap({
    result: await execute({ operation: listEntityTypes, input: { base: "TICKET" }, context }),
  });
  const line = {
    ...{ entityTypeId: lineType.id, name: "Room", itemId: room.id, quantity: 1 },
    ...{ offsetMinutes: 0, durationMinutes: 60, options },
  };
  return execute({
    operation: createTicketTemplate,
    input: {
      ...{ name: "Room package", entityTypeId: types.items[0]?.id ?? "" },
      ...{ statusId: ticket.statusId, lines: [line] },
    },
    context,
  });
}

const lineOptions = async ({ context, ticketId }: { context: ExecuteContext; ticketId: string }) =>
  (await context.db.line.findMany({ where: { ticketId, role: "OPTION" } })).map(
    (line) => line.itemId,
  );

describe("package default choices (ADR 0089)", () => {
  it("stores defaults, previews them and applies them in createFromTemplate", async () => {
    const setup = await optionsSetup();
    const { context, technician, ticket } = setup;
    const made = unwrap({
      result: await makePackage({ setup, options: [{ itemId: technician.id }] }),
    });
    expect(made.lines[0]?.options).toEqual([{ itemId: technician.id, stale: false }]);
    const preview = unwrap({
      result: await execute({
        operation: previewTicketLines,
        input: {
          ...{ templateIds: [made.id], customerId: ticket.customerId, headcount: 4, startsAt },
          endsAt: new Date(startsAt.getTime() + 3_600_000),
        },
        context,
      }),
    });
    expect(preview.entries[0]?.lines[0]?.options).toEqual([{ itemId: technician.id }]);
    const created = unwrap({
      result: await execute({
        operation: createTicketFromTemplate,
        input: { templateId: made.id, ...partyOf({ ticket }), startsAt, headcount: 4 },
        context,
      }),
    });
    expect(await lineOptions({ context, ticketId: created.id })).toEqual([technician.id]);
  });

  it("refuses defaults that are not options, or more than a group allows", async () => {
    const setup = await optionsSetup();
    const { technician, selfInstall, lunch } = setup;
    const foreign = await makePackage({ setup, options: [{ itemId: lunch.id }] });
    expect(foreign.ok ? [] : foreign.error.issues.map((issue) => issue.path)).toEqual([
      "lines.0.options",
    ]);
    const both = await makePackage({
      setup,
      options: [{ itemId: technician.id }, { itemId: selfInstall.id }],
    });
    expect(errorCode({ result: both })).toBe("VALIDATION");
  });

  it("marks a default stale when the item drops the option, and skips it on use", async () => {
    const setup = await optionsSetup();
    const { context, room, technician, selfInstall, lounge, ticket } = setup;
    const made = unwrap({
      result: await makePackage({ setup, options: [{ itemId: technician.id }] }),
    });
    const customisationGroups = [
      {
        ...{ name: "Installation", minPick: 1, maxPick: 1, split: false },
        options: [{ itemId: selfInstall.id, priceEffect: "INCLUDED" as const }],
      },
      {
        ...{ name: "Furniture", minPick: 0, maxPick: 1, split: false },
        options: [{ itemId: lounge.id, priceEffect: "REPLACES" as const }],
      },
    ];
    unwrap({
      result: await execute({
        operation: updateItem,
        input: { id: room.id, customisationGroups },
        context,
      }),
    });
    const created = unwrap({
      result: await execute({
        operation: createTicketFromTemplate,
        input: { templateId: made.id, ...partyOf({ ticket }), startsAt, headcount: 4 },
        context,
      }),
    });
    expect(await lineOptions({ context, ticketId: created.id })).toEqual([]);
  });
});

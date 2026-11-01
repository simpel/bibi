import { describe, expect, it } from "vitest";
import { errorCode, unwrap } from "./helpers";
import { splitSetup } from "./line-option-quantities-helpers";
import { linesOf, runCreate, ticketCount } from "./ticket-create-helpers";
import { partyOf } from "./ticket-helpers";

type Setup = Awaited<ReturnType<typeof splitSetup>>;

/** `ticket.create` with one dinner line for 14 that chooses `options`. */
const createDinner = ({ setup, options }: { setup: Setup; options: unknown[] }) =>
  runCreate({
    context: setup.context,
    input: {
      entityTypeId: setup.type.id,
      ...partyOf({ ticket: setup.ticket }),
      lines: [
        {
          entityTypeId: setup.lineType.id,
          name: "Dinner",
          itemId: setup.dinner.id,
          quantity: 14,
          options,
        },
      ],
    },
  });

describe("ticket.create: a line's chosen options (ADR 0081, 0082)", () => {
  it("makes option lines under the line: split quantities and a whole-line option", async () => {
    const setup = await splitSetup();
    const { context, fish, veg, espresso } = setup;
    const options = [
      { itemId: fish.id, quantity: 10 },
      { itemId: veg.id, quantity: 4 },
      { itemId: espresso.id },
    ];
    const ticket = unwrap({ result: await createDinner({ setup, options }) });
    const [dinner, ...chosen] = await linesOf({ context, ticketId: ticket.id });
    expect(dinner?.name).toBe("Dinner");
    expect(chosen.map((line) => [line.itemId, line.quantity, line.parentLineId])).toEqual([
      [fish.id, 10, dinner?.id],
      [veg.id, 4, dinner?.id],
      [espresso.id, null, dinner?.id],
    ]);
    expect(chosen.map((line) => line.priceEffect)).toEqual(["EXTRA", "EXTRA", "EXTRA"]);
  });

  it("refuses a split option without a quantity at the line's options and creates nothing", async () => {
    const setup = await splitSetup();
    const before = await ticketCount({ context: setup.context });
    const result = await createDinner({ setup, options: [{ itemId: setup.fish.id }] });
    expect(errorCode({ result })).toBe("VALIDATION");
    const paths = result.ok ? [] : result.error.issues.map((issue) => issue.path);
    expect(paths).toEqual(["lines.0.options"]);
    expect(await ticketCount({ context: setup.context })).toBe(before);
  });

  it("refuses an item that is not an option of the line's item", async () => {
    const setup = await splitSetup();
    const result = await createDinner({ setup, options: [{ itemId: setup.lunch.id }] });
    expect(errorCode({ result })).toBe("VALIDATION");
    expect(result.ok ? [] : result.error.issues.map((issue) => issue.path)).toEqual([
      "lines.0.options",
    ]);
  });
});

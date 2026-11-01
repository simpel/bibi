import { describe, expect, it } from "vitest";
import { errorCode, unwrap } from "./helpers";
import { requirementSetup } from "./requirement-helpers";
import { linesOf, runCreate, ticketCount } from "./ticket-create-helpers";
import { partyOf } from "./ticket-helpers";

type Setup = Awaited<ReturnType<typeof requirementSetup>>;

/** `ticket.create` with one untimed line that carries `requirements`. */
const createWithNeeds = ({ setup, requirements }: { setup: Setup; requirements: unknown[] }) =>
  runCreate({
    context: setup.context,
    input: {
      entityTypeId: setup.ticket.entityTypeId,
      ...partyOf({ ticket: setup.ticket }),
      lines: [{ entityTypeId: setup.morning.entityTypeId, name: "Lunch", requirements }],
    },
  });

describe("ticket.create: needs on a line (ADR 0081, 0021)", () => {
  it("creates the line's requirements as counts per list value, with their fields", async () => {
    const setup = await requirementSetup();
    const { context, type, key, gluten, lactose } = setup;
    const requirements = [
      { entityTypeId: type.id, vocabularyValueId: gluten, quantity: 3, fields: { [key]: "A" } },
      { entityTypeId: type.id, vocabularyValueId: lactose, quantity: 1 },
    ];
    const ticket = unwrap({ result: await createWithNeeds({ setup, requirements }) });
    const [line] = await linesOf({ context, ticketId: ticket.id });
    const rows = await context.db.requirement.findMany({
      where: { ticketId: ticket.id },
      orderBy: { quantity: "desc" },
    });
    expect(rows.map((row) => [row.lineId, row.vocabularyValueId, row.quantity])).toEqual([
      [line?.id, gluten, 3],
      [line?.id, lactose, 1],
    ]);
    expect(rows[0]?.fields).toEqual({ [key]: "A" });
  });

  it("refuses two counts for one value on a line with CONFLICT and creates nothing", async () => {
    const setup = await requirementSetup();
    const { context, type, gluten } = setup;
    const before = await ticketCount({ context });
    const need = { entityTypeId: type.id, vocabularyValueId: gluten, quantity: 2 };
    const result = await createWithNeeds({ setup, requirements: [need, need] });
    expect(errorCode({ result })).toBe("CONFLICT");
    expect(result.ok ? [] : result.error.issues.map((issue) => issue.path)).toEqual([
      "lines.0.requirements.1.vocabularyValueId",
    ]);
    expect(await ticketCount({ context })).toBe(before);
  });

  it("refuses an unknown list value or requirement type at its path", async () => {
    const setup = await requirementSetup();
    const need = {
      entityTypeId: setup.morning.entityTypeId,
      vocabularyValueId: "nope",
      quantity: 1,
    };
    const result = await createWithNeeds({ setup, requirements: [need] });
    expect(errorCode({ result })).toBe("VALIDATION");
    expect(result.ok ? [] : result.error.issues.map((issue) => issue.path)).toEqual([
      "lines.0.requirements.0.entityTypeId",
      "lines.0.requirements.0.vocabularyValueId",
    ]);
  });
});

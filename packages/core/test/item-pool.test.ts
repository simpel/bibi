import { describe, expect, it } from "vitest";
import { type ExecuteContext, execute, freeUnits } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createHoldLine } from "./hold-helpers";
import { createPool } from "./item-pool-helpers";
import { hours } from "./occupancy-helpers";
import { ticketSetup } from "./ticket-helpers";

type Ctx = { context: ExecuteContext };

const window = hours({ from: 10, to: 12 });
const run = ({ context, ...input }: Ctx & Record<string, unknown>) =>
  execute({ operation: freeUnits, input: { ...window, ...input }, context });

describe("item.freeUnits (ADR 0059, pool targets)", () => {
  it("lists all ten units of a pool in a fixed order with the first as prepick", async () => {
    const { context } = await ticketSetup();
    const { type, units } = await createPool({ context });
    const first = unwrap({ result: await run({ context, entityTypeId: type.id }) });
    expect(first.items.map(({ id }) => id)).toEqual(units);
    expect(first.prepickId).toBe(units[0]);
    const again = unwrap({ result: await run({ context, entityTypeId: type.id }) });
    expect(again).toEqual(first);
  });

  it("narrows by required list values", async () => {
    const { context } = await ticketSetup();
    const { type, units, wireless } = await createPool({ context });
    const result = await run({ context, entityTypeId: type.id, tagValueIds: [wireless] });
    expect(unwrap({ result }).items.map(({ id }) => id)).toEqual(units.slice(0, 4));
  });

  it("skips units with a hard hold in the window and prepicks the next free one", async () => {
    const { context } = await ticketSetup();
    const { type, units } = await createPool({ context });
    unwrap({
      result: await createHoldLine({
        context,
        itemId: units[0] as string,
        hold: "HARD",
        from: 11,
        to: 13,
      }),
    });
    const result = unwrap({ result: await run({ context, entityTypeId: type.id }) });
    expect(result.items.map(({ id }) => id)).toEqual(units.slice(1));
    expect(result.prepickId).toBe(units[1]);
    const later = hours({ from: 14, to: 15 });
    const free = unwrap({ result: await run({ context, entityTypeId: type.id, ...later }) });
    expect(free.prepickId).toBe(units[0]);
  });

  it("does not let a soft hold take a unit", async () => {
    const { context } = await ticketSetup();
    const { type, units } = await createPool({ context });
    unwrap({
      result: await createHoldLine({
        context,
        itemId: units[0] as string,
        hold: "SOFT",
        from: 10,
        to: 12,
      }),
    });
    const result = unwrap({ result: await run({ context, entityTypeId: type.id }) });
    expect(result.items).toHaveLength(10);
  });

  it("pages through the pool and keeps the prepick", async () => {
    const { context } = await ticketSetup();
    const { type, units } = await createPool({ context });
    const one = unwrap({ result: await run({ context, entityTypeId: type.id, limit: 4 }) });
    expect(one.items).toHaveLength(4);
    const two = unwrap({
      result: await run({ context, entityTypeId: type.id, limit: 4, cursor: one.nextCursor }),
    });
    expect(two.items.map(({ id }) => id)).toEqual(units.slice(4, 8));
    expect(two.prepickId).toBe(units[0]);
  });

  it("resolves a specific item as a pool of one", async () => {
    const { context } = await ticketSetup();
    const { units } = await createPool({ context });
    const result = unwrap({ result: await run({ context, itemId: units[3] }) });
    expect(result.items.map(({ id }) => id)).toEqual([units[3]]);
    expect(result.prepickId).toBe(units[3]);
  });

  it("refuses a bad target, window, tag and a caller who cannot read tickets", async () => {
    const { context } = await ticketSetup();
    const { type, units } = await createPool({ context });
    expect(errorCode({ result: await run({ context }) })).toBe("VALIDATION");
    const both = await run({ context, itemId: units[0], entityTypeId: type.id });
    expect(errorCode({ result: both })).toBe("VALIDATION");
    const tagged = await run({ context, itemId: units[0], tagValueIds: ["x"] });
    expect(errorCode({ result: tagged })).toBe("VALIDATION");
    const unknownTag = await run({ context, entityTypeId: type.id, tagValueIds: ["nope"] });
    expect(errorCode({ result: unknownTag })).toBe("VALIDATION");
    const backwards = await run({ context, entityTypeId: type.id, endsAt: window.startsAt });
    expect(errorCode({ result: backwards })).toBe("VALIDATION");
    const noTickets = testContext({
      organizationId: context.organizationId,
      permissions: { item: ["read"] },
    });
    const denied = await run({ context: noTickets, entityTypeId: type.id });
    expect(errorCode({ result: denied })).toBe("VALIDATION");
    const noItems = testContext({
      organizationId: context.organizationId,
      permissions: { ticket: ["read"] },
    });
    expect(errorCode({ result: await run({ context: noItems, entityTypeId: type.id }) })).toBe(
      "FORBIDDEN",
    );
  });

  it("returns NOT_FOUND for another organization's item, type and values", async () => {
    const mine = await ticketSetup();
    const other = testContext();
    const { type, units, wireless } = await createPool({ context: mine.context });
    expect(errorCode({ result: await run({ context: other, itemId: units[0] }) })).toBe(
      "NOT_FOUND",
    );
    expect(errorCode({ result: await run({ context: other, entityTypeId: type.id }) })).toBe(
      "NOT_FOUND",
    );
    const own = await createPool({ context: other });
    const foreign = await run({
      context: other,
      entityTypeId: own.type.id,
      tagValueIds: [wireless],
    });
    expect(errorCode({ result: foreign })).toBe("VALIDATION");
  });
});

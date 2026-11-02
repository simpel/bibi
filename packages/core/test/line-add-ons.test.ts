import { describe, expect, it } from "vitest";
import { archiveLine, createEntityType, execute, getLine, updateLine } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addLine, addOnSetup, END, START } from "./line-add-on-helpers";
import { choose, optionsSetup, picks } from "./line-options-helpers";
import { addTestLines } from "./quote-helpers";
import { createTestTicket } from "./ticket-helpers";

const HOUR = 3_600_000;

describe("add-ons: line.create with parentLineId (ADR 0088)", () => {
  it("is an ADD_ON with the parent's type and period by default", async () => {
    const { context, ticket, parent, coffee } = await addOnSetup();
    const input = { context, ticketId: ticket.id, parentLineId: parent.id, itemId: coffee.id };
    const addOn = unwrap({ result: await addLine(input) });
    expect(addOn).toMatchObject({ role: "ADD_ON", parentLineId: parent.id, priceEffect: null });
    expect(addOn).toMatchObject({
      entityTypeId: parent.entityTypeId,
      startsAt: START,
      endsAt: END,
    });
    expect(parent.role).toBeNull();
  });

  it("takes its own type and period when given, and untimed from an untimed parent", async () => {
    const { context, ticket, parent, lineType } = await addOnSetup();
    const other = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "LINE", name: "AV" },
        context,
      }),
    });
    const morning = { startsAt: START, endsAt: new Date(START.getTime() + HOUR) };
    const base = { context, ticketId: ticket.id, parentLineId: parent.id };
    const own = unwrap({ result: await addLine({ ...base, entityTypeId: other.id, ...morning }) });
    expect(own).toMatchObject({ entityTypeId: other.id, ...morning });
    const [untimed] = await addTestLines({
      ...{ context, ticketId: ticket.id, lineTypeId: lineType.id },
      lines: [{ itemId: parent.itemId ?? "", name: "Fee" }],
    });
    const parentLineId = untimed?.id ?? "";
    const free = unwrap({ result: await addLine({ ...base, parentLineId, name: "Free text" }) });
    expect(free).toMatchObject({ startsAt: null, endsAt: null, itemId: null });
  });

  it("goes only under a top-level line of the same ticket, one level", async () => {
    const { context, ticket, parent } = await addOnSetup();
    const base = { context, ticketId: ticket.id };
    const addOn = unwrap({ result: await addLine({ ...base, parentLineId: parent.id }) });
    const nested = await addLine({ ...base, parentLineId: addOn.id });
    expect(errorCode({ result: nested })).toBe("VALIDATION");
    const options = await optionsSetup();
    const { items } = unwrap({
      result: await choose({
        ...{ context: options.context, lineId: options.lineId },
        options: picks({ ids: [options.technician.id] }),
      }),
    });
    const under = { context: options.context, ticketId: options.ticket.id };
    const onOption = await addLine({ ...under, parentLineId: items[0]?.id ?? "" });
    expect(errorCode({ result: onOption })).toBe("VALIDATION");
    const missing = await addLine({ ...base, parentLineId: "nope" });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
    expect(errorCode({ result: await addLine({ ...base }) })).toBe("VALIDATION");
  });

  it("refuses a parent on another ticket", async () => {
    const one = await addOnSetup();
    const { context, ticket } = one;
    const other = await addOnSetup();
    // Another organization's line is NOT_FOUND; one of the same org on another ticket VALIDATION.
    const foreign = await addLine({ context, ticketId: ticket.id, parentLineId: other.parent.id });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    const elsewhere = await createTestTicket({
      ...{ context, entityTypeId: one.type.id, customerId: one.customer.id },
    });
    const [second] = await addTestLines({
      ...{ context, ticketId: elsewhere.id, lineTypeId: one.lineType.id },
      lines: [{ itemId: one.coffee.id }],
    });
    const crossed = await addLine({ context, ticketId: ticket.id, parentLineId: second?.id ?? "" });
    expect(errorCode({ result: crossed })).toBe("VALIDATION");
  });

  it("moves with its parent and is removed with it", async () => {
    const { context, ticket, parent } = await addOnSetup();
    const base = { context, ticketId: ticket.id, parentLineId: parent.id };
    const timed = unwrap({ result: await addLine(base) });
    const later = {
      startsAt: new Date(START.getTime() + HOUR),
      endsAt: new Date(END.getTime() + HOUR),
    };
    unwrap({
      result: await execute({ operation: updateLine, input: { id: parent.id, ...later }, context }),
    });
    const moved = unwrap({
      result: await execute({ operation: getLine, input: { id: timed.id }, context }),
    });
    expect(moved).toMatchObject(later);
    unwrap({
      result: await execute({ operation: archiveLine, input: { id: parent.id }, context }),
    });
    const gone = await execute({ operation: getLine, input: { id: timed.id }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });

  it("lets a line with only add-ons change its item, not one with options", async () => {
    const { context, ticket, parent, coffee } = await addOnSetup();
    unwrap({ result: await addLine({ context, ticketId: ticket.id, parentLineId: parent.id }) });
    const input = { id: parent.id, itemId: coffee.id };
    const changed = await execute({ operation: updateLine, input, context });
    expect(changed.ok).toBe(true);
    const options = await optionsSetup();
    const { lineId, technician } = options;
    const ctx = { context: options.context, lineId };
    unwrap({ result: await choose({ ...ctx, options: picks({ ids: [technician.id] }) }) });
    const locked = await execute({
      operation: updateLine,
      input: { id: lineId, itemId: options.lounge.id },
      context: options.context,
    });
    expect(errorCode({ result: locked })).toBe("VALIDATION");
  });
});

import { describe, expect, it } from "vitest";
import { createTicket, createTicketTemplate, execute, updateTicket } from "../src/index";
import { calendarSetup, range } from "./calendar-range-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { contactAt, createTestTicket, ticketSetup } from "./ticket-helpers";
import { roomAndDish, templateSetup } from "./ticket-template-helpers";

describe("ticket intake foundations (ADR 0081)", () => {
  it("requires a contact on every new ticket and never clears it", async () => {
    const { context, type, customer } = await ticketSetup();
    const input = { entityTypeId: type.id, customerId: customer.id };
    const missing = await execute({ operation: createTicket, input, context });
    expect(missing.ok ? null : missing.error.issues[0]?.path).toBe("contactId");
    const ticket = await createTestTicket({ context, ...input });
    const cleared = await execute({
      operation: updateTicket,
      input: { id: ticket.id, contactId: null },
      context,
    });
    expect(errorCode({ result: cleared })).toBe("VALIDATION");
    const after = await context.db.ticket.findFirstOrThrow({ where: { id: ticket.id } });
    expect(after.contactId).toBe(ticket.contactId);
  });

  it("keeps booking-level notes on create and update, and null clears them", async () => {
    const { context, type, customer } = await ticketSetup();
    const contactId = (await contactAt({ context, customerId: customer.id })).id;
    const note = "Guests arrive by boat.\nInvoice reference VCC-4471.";
    const created = unwrap({
      result: await execute({
        operation: createTicket,
        input: { entityTypeId: type.id, customerId: customer.id, contactId, note },
        context,
      }),
    });
    expect(created.note).toBe(note);
    const update = ({ value }: { value: string | null }) =>
      execute({ operation: updateTicket, input: { id: created.id, note: value }, context });
    expect(unwrap({ result: await update({ value: "Changed" }) }).note).toBe("Changed");
    expect(unwrap({ result: await update({ value: null }) }).note).toBeNull();
    const tooLong = await update({ value: "x".repeat(4001) });
    expect(errorCode({ result: tooLong })).toBe("VALIDATION");
  });

  it("stores a package's guest range and refuses a lower limit above the upper", async () => {
    const setup = await templateSetup();
    const { context } = setup;
    const base = {
      entityTypeId: setup.ticketType.id,
      statusId: setup.confirmed.id,
      lines: roomAndDish({ setup }),
    };
    type MakeInput = { name: string; minGuests?: number; maxGuests?: number };
    const make = ({ name, ...guests }: MakeInput) =>
      execute({ operation: createTicketTemplate, input: { ...base, name, ...guests }, context });
    const made = unwrap({ result: await make({ name: "Tasting", minGuests: 2, maxGuests: 16 }) });
    expect(made).toMatchObject({ minGuests: 2, maxGuests: 16 });
    const open = unwrap({ result: await make({ name: "Open" }) });
    expect(open).toMatchObject({ minGuests: null, maxGuests: null });
    const wrong = await make({ name: "Wrong", minGuests: 20, maxGuests: 10 });
    expect(wrong.ok ? null : wrong.error.issues[0]?.path).toBe("minGuests");
  });

  it("narrows calendar.range to the given items", async () => {
    const { context, item } = await calendarSetup();
    const other = await createTestItem({
      context,
      entityTypeId: item.entityTypeId,
      name: "Unused room",
    });
    const day = { from: "2037-11-01", to: "2037-11-01" };
    const all = await range({ context, input: day });
    const mine = await range({ context, input: { ...day, itemIds: [item.id] } });
    const none = await range({ context, input: { ...day, itemIds: [other.id] } });
    expect(all.blocks.length).toBeGreaterThan(0);
    expect(mine.blocks.length).toBe(all.blocks.filter((b) => b.itemId === item.id).length);
    expect(none.blocks).toEqual([]);
  });
});

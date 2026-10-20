import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveItem,
  archiveLine,
  createOccupancy,
  execute,
  listRequirements,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestLine, programSetup } from "./line-helpers";
import { hours } from "./occupancy-helpers";
import { addRequirement, requirementSetup } from "./requirement-helpers";

describe("archive cascades keep requirements consistent (#215)", () => {
  it("archives a line's requirements with the line, one audit row each", async () => {
    const { context, ticket, morning, type, gluten, lactose } = await requirementSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    const own = unwrap({
      result: await addRequirement({
        ...base,
        lineId: morning.id,
        vocabularyValueId: gluten,
        quantity: 1,
      }),
    });
    const onTicket = unwrap({
      result: await addRequirement({ ...base, vocabularyValueId: lactose, quantity: 2 }),
    });
    const input = { id: morning.id };
    unwrap({ result: await execute({ operation: archiveLine, input, context }) });
    const left = await context.db.requirement.findMany({ where: { ticketId: ticket.id } });
    expect(left.map((row) => row.id)).toEqual([onTicket.id]);
    const audit = await context.db.auditLog.findMany({
      where: { operation: "line.archive", entityType: "requirement", entityId: own.id },
    });
    expect(audit).toHaveLength(1);
  });

  it("archives the ticket's requirements when the customer cascade archives the ticket", async () => {
    const { context, ticket, morning, type, gluten } = await requirementSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    unwrap({ result: await addRequirement({ ...base, vocabularyValueId: gluten, quantity: 1 }) });
    unwrap({
      result: await addRequirement({
        ...base,
        lineId: morning.id,
        vocabularyValueId: gluten,
        quantity: 1,
      }),
    });
    const input = { id: ticket.customerId, archiveTickets: true };
    unwrap({ result: await execute({ operation: archiveCustomer, input, context }) });
    const archived = await context.db.requirement.findMany({
      where: { ticketId: ticket.id, status: "ARCHIVED" },
    });
    expect(archived).toHaveLength(2);
    const active = await context.db.requirement.findMany({ where: { ticketId: ticket.id } });
    expect(active).toHaveLength(0);
    const listed = await execute({
      operation: listRequirements,
      input: { ticketId: ticket.id },
      context,
    });
    expect(unwrap({ result: listed }).items).toHaveLength(0);
  });
});

describe("item.archive and occupancy (#213)", () => {
  it("refuses while the item has an active manual block", async () => {
    const { context, room } = await programSetup();
    const block = { itemId: room.id, type: "MAINTENANCE" as const, ...hours({ from: 8, to: 12 }) };
    unwrap({ result: await execute({ operation: createOccupancy, input: block, context }) });
    const refused = await execute({ operation: archiveItem, input: { id: room.id }, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const row = await context.db.item.findFirst({ where: { id: room.id } });
    expect(row?.status).toBe("ACTIVE");
  });
});

describe("customer.archive and the customer's bundles (#224)", () => {
  it("refuses while an active line uses a bundle and archives nothing", async () => {
    const { context, ticket, room, type } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    unwrap({ result: await createTestLine({ ...base, from: 9, to: 10, itemId: room.id }) });
    const other = await createTestCustomer({ context, name: "Other" });
    // A bundle of another customer, left on a line before it was reassigned.
    await context.db.item.update({ where: { id: room.id }, data: { customerId: other.id } });
    const input = { id: other.id };
    const refused = await execute({ operation: archiveCustomer, input, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const row = await context.db.item.findFirst({ where: { id: room.id } });
    expect(row?.status).toBe("ACTIVE");
  });
});

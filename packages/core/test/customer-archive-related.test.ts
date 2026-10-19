import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveItem,
  archiveSetup,
  type ExecuteContext,
  execute,
  saveItemAsPackage,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createMealSetup } from "./item-choice-group-helpers";
import { createTestLine, programSetup } from "./line-helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";

type ArchiveInput = {
  context: ExecuteContext;
  id: string;
  archiveTickets?: boolean;
};

const archive = ({ context, ...input }: ArchiveInput) =>
  execute({ operation: archiveCustomer, input, context });

describe("customer.archive with packages (#151)", () => {
  it("archives the customer's packages with it, one audit row each", async () => {
    const { context, customer } = await ticketSetup();
    const { meal, cod, veal } = await createMealSetup({ context });
    const pkg = unwrap({
      result: await execute({
        operation: saveItemAsPackage,
        input: {
          entityTypeId: meal.id,
          customerId: customer.id,
          name: "Acme lunch",
          components: [{ itemId: cod }, { itemId: veal }],
        },
        context,
      }),
    });
    unwrap({ result: await archive({ context: context, id: customer.id }) });
    const row = await context.db.item.findFirst({ where: { id: pkg.id, status: "ARCHIVED" } });
    expect(row).not.toBeNull();
    const audit = await context.db.auditLog.findMany({
      where: { operation: "customer.archive", entityType: "item", entityId: pkg.id },
    });
    expect(audit).toHaveLength(1);
  });
});

describe("archiving tickets releases lines and rooms (#166, #145)", () => {
  it("frees the room after the customer cascade and archives the line", async () => {
    const { context, ticket, type, room, setup } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({
      result: await createTestLine({ ...base, from: 10, to: 12, setupId: setup.id }),
    });
    const other = await createTestTicket({
      context,
      entityTypeId: ticket.entityTypeId,
      customerId: ticket.customerId,
    });
    const clash = await createTestLine({ ...base, ticketId: other.id, from: 10, to: 12 });
    expect(errorCode({ result: clash })).toBe("CONFLICT");

    unwrap({
      result: await archive({ context: context, id: ticket.customerId, archiveTickets: true }),
    });

    const archived = await context.db.line.findFirst({
      where: { id: item.id, status: "ARCHIVED" },
    });
    expect(archived).not.toBeNull();
    const held = await context.db.occupancy.findMany({
      where: { sourceType: "line", sourceId: item.id },
    });
    expect(held).toHaveLength(0);
    const audit = await context.db.auditLog.findMany({
      where: { operation: "customer.archive", entityType: "line" },
    });
    expect(audit).toHaveLength(1);
  });
});

describe("item.archive and setup.archive with lines", () => {
  it("are refused while an active line uses the item or the setup", async () => {
    const { context, ticket, type, room, setup } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    unwrap({ result: await createTestLine({ ...base, from: 10, to: 12, setupId: setup.id }) });
    const item = await execute({ operation: archiveItem, input: { id: room.id }, context });
    expect(errorCode({ result: item })).toBe("CONFLICT");
    const archivedSetup = await execute({
      operation: archiveSetup,
      input: { id: setup.id },
      context,
    });
    expect(errorCode({ result: archivedSetup })).toBe("CONFLICT");
  });
});

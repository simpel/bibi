import { describe, expect, it } from "vitest";
import { execute, updateLine } from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestLine, programSetup } from "./line-helpers";

describe("customer bundles on tickets", () => {
  it("only lets a ticket use its own customer's bundle or a general item", async () => {
    const { context, ticket, type, room } = await programSetup();
    const other = await createTestCustomer({ context, name: "Other" });
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    await context.db.item.update({ where: { id: room.id }, data: { customerId: other.id } });
    const denied = await createTestLine({ ...base, from: 9, to: 10, itemId: room.id });
    expect(errorCode({ result: denied })).toBe("VALIDATION");
    await context.db.item.update({
      where: { id: room.id },
      data: { customerId: ticket.customerId },
    });
    unwrap({ result: await createTestLine({ ...base, from: 9, to: 10, itemId: room.id }) });
    await context.db.item.update({ where: { id: room.id }, data: { customerId: null } });
    const general = unwrap({ result: await createTestLine({ ...base, from: 11, to: 12 }) });
    await context.db.item.update({ where: { id: room.id }, data: { customerId: other.id } });
    const moved = await execute({
      operation: updateLine,
      input: { id: general.id, itemId: room.id },
      context,
    });
    expect(errorCode({ result: moved })).toBe("VALIDATION");
  });
});

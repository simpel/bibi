import { describe, expect, it } from "vitest";
import { execute, updateProgramItem } from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, unwrap } from "./helpers";
import { addProgramItem, programSetup } from "./program-item-helpers";

describe("customer packages on bookings", () => {
  it("only lets a booking use its own customer's package or a general item", async () => {
    const { context, booking, type, room } = await programSetup();
    const other = await createTestCustomer({ context, name: "Other" });
    const base = { context, bookingId: booking.id, entityTypeId: type.id };
    await context.db.item.update({ where: { id: room.id }, data: { customerId: other.id } });
    const denied = await addProgramItem({ ...base, from: 9, to: 10, itemId: room.id });
    expect(errorCode({ result: denied })).toBe("VALIDATION");
    await context.db.item.update({
      where: { id: room.id },
      data: { customerId: booking.customerId },
    });
    unwrap({ result: await addProgramItem({ ...base, from: 9, to: 10, itemId: room.id }) });
    await context.db.item.update({ where: { id: room.id }, data: { customerId: null } });
    const general = unwrap({ result: await addProgramItem({ ...base, from: 11, to: 12 }) });
    await context.db.item.update({ where: { id: room.id }, data: { customerId: other.id } });
    const moved = await execute({
      operation: updateProgramItem,
      input: { id: general.id, itemId: room.id },
      context,
    });
    expect(errorCode({ result: moved })).toBe("VALIDATION");
  });
});

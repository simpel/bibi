import { describe, expect, it } from "vitest";
import { createOrderStatus, execute, previewArchiveOrderStatus } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestOrder, orderSetup, placeInStatus } from "./order-helpers";
import { statusByName } from "./order-status-helpers";

describe("orderStatus.archivePreview (ADR 0043)", () => {
  it("counts the orders that move and lists blockers without changing anything", async () => {
    const { context, type, customer } = await orderSetup();
    const extra = unwrap({
      result: await execute({
        operation: createOrderStatus,
        input: { name: "Site visit", color: "#0d9488" },
        context,
      }),
    });
    const order = await createTestOrder({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    await placeInStatus({ order, statusId: extra.id });
    const preview = ({ ...input }: { id: string; targetStatusId?: string }) =>
      execute({ operation: previewArchiveOrderStatus, input, context });
    const noTarget = unwrap({ result: await preview({ id: extra.id }) });
    expect(noTarget).toMatchObject({ archivable: false, moving: 1, targetRequired: true });
    expect(noTarget.blockers.length).toBeGreaterThan(0);
    const lost = await statusByName({ context, name: "Lost" });
    const blocked = unwrap({ result: await preview({ id: extra.id, targetStatusId: lost.id }) });
    expect(blocked).toMatchObject({ archivable: false, moving: 1 });
    const lead = await statusByName({ context, name: "Lead" });
    const entry = unwrap({ result: await preview({ id: lead.id }) });
    expect(entry.archivable).toBe(false);
    const row = await context.db.order.findFirstOrThrow({ where: { id: order.id } });
    expect(row.statusId).toBe(extra.id);
    const orderStatus = await context.db.orderStatus.findFirstOrThrow({
      where: { id: extra.id },
    });
    expect(orderStatus.status).toBe("ACTIVE");
    expect(errorCode({ result: await preview({ id: "unknown" }) })).toBe("NOT_FOUND");
  });
});

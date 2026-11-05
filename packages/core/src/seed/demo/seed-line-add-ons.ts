import { ok, type Result } from "../../errors/result";
import { createLine } from "../../features/line/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoAddOn } from "./order-types";
import { missing } from "./seed-fields";

export type SeedLineAddOnsInput = {
  context: ExecuteContext;
  orderId: string;
  lineId: string;
  addOns: readonly DemoAddOn[] | undefined;
  /** Local time `HH:MM` on the order's day → instant. */
  at: (input: { time: string }) => Date;
};

/**
 * The line's add-ons (ADR 0088) through `line.create` with `parentLineId`, as staff add them:
 * the type comes from the line, the period too unless the data gives its own.
 */
export async function seedLineAddOns({
  context,
  orderId,
  lineId,
  addOns,
  at,
}: SeedLineAddOnsInput): Promise<Result<true>> {
  for (const addOn of addOns ?? []) {
    const item = await context.db.item.findFirst({
      where: { name: addOn.item, customerId: null },
      select: { id: true },
    });
    if (!item) return missing({ what: `add-on item ${addOn.item}` });
    const input = {
      ...{ orderId, parentLineId: lineId, itemId: item.id, name: addOn.name },
      ...(addOn.from && addOn.to
        ? { startsAt: at({ time: addOn.from }), endsAt: at({ time: addOn.to }) }
        : {}),
      ...(addOn.quantity === undefined ? {} : { quantity: addOn.quantity }),
      ...(addOn.unitPriceKr === undefined ? {} : { unitPriceMinor: addOn.unitPriceKr * 100 }),
    };
    const created = await execute({ operation: createLine, input, context });
    if (!created.ok) return created;
  }
  return ok({ value: true });
}

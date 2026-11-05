import { ok, type Result } from "../../errors/result";
import { expandLineBundle } from "../../features/line/expand-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrder } from "./order-types";
import { missing } from "./seed-fields";

export type SeedBundleLinesInput = {
  context: ExecuteContext;
  orderId: string;
  order: Pick<DemoOrder, "bundles">;
  /** Local time `HH:MM` on the order's day → instant. */
  at: (input: { time: string }) => Date;
};

/**
 * ADR 0059: each of the order's bundles through `line.expandBundle` as SYSTEM, in the
 * organization's line type: one bundle line and its part lines, each in its entry status's cell.
 */
export async function seedDemoBundleLines({
  context,
  orderId,
  order,
  at,
}: SeedBundleLinesInput): Promise<Result<true>> {
  const bundles = order.bundles ?? [];
  if (bundles.length === 0) return ok({ value: true });
  const type = await context.db.entityType.findFirst({ where: { base: "LINE" } });
  if (!type) return missing({ what: "a line type (base LINE)" });
  for (const bundle of bundles) {
    const item = await context.db.item.findFirst({ where: { name: bundle.item } });
    if (!item) return missing({ what: `bundle ${bundle.item}` });
    const input = {
      ...{ orderId, entityTypeId: type.id, itemId: item.id },
      ...{ startsAt: at({ time: bundle.from }), endsAt: at({ time: bundle.to }) },
    };
    const expanded = await execute({ operation: expandLineBundle, input, context });
    if (!expanded.ok) return expanded;
  }
  return ok({ value: true });
}

import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { loadLayoutFacts } from "../floor-plan/layout-seats";
import { effectiveQuantity } from "../line/effective-values";

export type CheckPeopleLimitLoweredInput = {
  context: Pick<OperationContext, "db">;
  itemId: string;
  maxPeople: number;
};

/**
 * ADR 0103 decision 4: a room's people limit may not go below one of its layouts' capacity or the
 * people of a line that books it and has not ended. `CONFLICT` naming them, at `maxPeople`.
 */
export async function checkPeopleLimitLowered({
  context,
  itemId,
  maxPeople,
}: CheckPeopleLimitLoweredInput): Promise<Result<true>> {
  const now = new Date();
  const [layouts, lines] = await Promise.all([
    loadLayoutFacts({ context, itemIds: [itemId] }),
    context.db.line.findMany({
      where: {
        itemId,
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        order: { status: "ACTIVE" },
      },
      select: {
        name: true,
        quantity: true,
        order: { select: { estimatedHeadcount: true, guaranteedHeadcount: true } },
      },
    }),
  ]);
  const overLayouts = [...layouts.values()].filter(
    (layout) => layout.effectiveCapacity !== null && layout.effectiveCapacity > maxPeople,
  );
  const overLines = lines.filter((line) => {
    const people = effectiveQuantity({ quantity: line.quantity, order: line.order }).value;
    return people !== null && people > maxPeople;
  });
  if (overLayouts.length === 0 && overLines.length === 0) return ok({ value: true });
  const names = [
    ...overLayouts.map((layout) => `layout ${layout.name} (${layout.effectiveCapacity})`),
    ...overLines.map((line) => `booking ${line.name}`),
  ].join(", ");
  const message = `The limit of ${maxPeople} people is below: ${names}`;
  return conflict({ message, issues: [{ path: "maxPeople", message }] });
}

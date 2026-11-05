import type { z } from "zod";
import type { OperationContext } from "../../operations/types";
import type { Trend } from "../../trend/trend-schema";
import { cardValues } from "../pipeline/card-values";
import type { StatusTileSchema } from "./schema";

type StatusTile = z.infer<typeof StatusTileSchema>;
type Context = Pick<OperationContext, "db" | "permissions">;

const sum = ({ values }: { values: readonly (number | null)[] }) => {
  const known = values.filter((value): value is number => value !== null);
  return known.length === 0 ? null : known.reduce((a, b) => a + b, 0);
};

export type StatusTilesInput = {
  context: Context;
  /** The status's count over the range (ADR 0086). */
  trendOf: (input: { statusId: string }) => Trend;
};

/** Open orders per open status now, with their value (ADR 0079) and trend (ADR 0086). */
export async function statusTiles({ context, trendOf }: StatusTilesInput): Promise<StatusTile[]> {
  const [statuses, orders] = await Promise.all([
    context.db.orderStatus.findMany({
      where: { status: "ACTIVE", closes: false },
      orderBy: { position: "asc" },
      select: { id: true, name: true, color: true },
    }),
    context.db.order.findMany({
      where: { status: "ACTIVE", orderStatus: { closes: false } },
      select: { id: true, statusId: true },
    }),
  ]);
  const valuesOf = await cardValues({ context, orderIds: orders.map((order) => order.id) });
  return statuses.map(({ id, name, color }) => {
    const own = orders.filter((order) => order.statusId === id);
    const values = own.map(({ id: orderId }) => valuesOf({ orderId }));
    return {
      statusId: id,
      name,
      color,
      orders: own.length,
      // As on the board: the estimate counts only where there is no accepted quote (ADR 0074).
      estimatedValueMinor: sum({
        values: values.map((value) =>
          value.confirmedValueMinor === null ? value.estimatedValueMinor : null,
        ),
      }),
      confirmedValueMinor: sum({ values: values.map((value) => value.confirmedValueMinor) }),
      trend: trendOf({ statusId: id }),
    };
  });
}

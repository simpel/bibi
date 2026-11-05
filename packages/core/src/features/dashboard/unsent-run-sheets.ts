import type { OperationContext } from "../../operations/types";
import type { UnsentRunSheet } from "./attention-schema";
import type { DashboardHorizon } from "./horizon";

type Context = Pick<OperationContext, "db">;

type Input = { context: Context; horizon: DashboardHorizon };

/** Every run sheet version of open orders with a line starting inside the horizon, newest first. */
function loadRunSheets({ context, horizon }: Input) {
  const inside = { status: "ACTIVE", startsAt: { gte: horizon.start, lt: horizon.end } } as const;
  return context.db.runSheet.findMany({
    where: {
      order: { status: "ACTIVE", orderStatus: { closes: false }, lines: { some: inside } },
    },
    orderBy: { version: "desc" },
    select: {
      id: true,
      orderId: true,
      runSheetDefinitionId: true,
      version: true,
      publishedAt: true,
      runSheetDefinition: { select: { name: true } },
      order: {
        select: {
          reference: true,
          title: true,
          lines: {
            where: inside,
            orderBy: { startsAt: "asc" },
            take: 1,
            select: { startsAt: true },
          },
        },
      },
    },
  });
}

/**
 * The newest version of each order's run sheets when it is not sent, for open orders with a line
 * starting inside the horizon (ADR 0080), soonest event first.
 */
export async function unsentRunSheets({ context, horizon }: Input): Promise<UnsentRunSheet[]> {
  const runSheets = await loadRunSheets({ context, horizon });
  const newest = new Map<string, (typeof runSheets)[number]>();
  for (const runSheet of runSheets) {
    const key = `${runSheet.orderId}:${runSheet.runSheetDefinitionId}`;
    if (!newest.has(key)) newest.set(key, runSheet);
  }
  return [...newest.values()]
    .flatMap((runSheet) => {
      const startsAt = runSheet.order.lines[0]?.startsAt;
      if (runSheet.publishedAt || !startsAt) return [];
      const { id: runSheetId, orderId, version } = runSheet;
      const { reference, title } = runSheet.order;
      const { name } = runSheet.runSheetDefinition;
      return [{ runSheetId, orderId, reference, title, name, version, startsAt }];
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

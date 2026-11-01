import type { z } from "zod";
import type { OperationContext } from "../../operations/types";
import { cardValues } from "../pipeline/card-values";
import type { StatusTileSchema } from "./schema";

type StatusTile = z.infer<typeof StatusTileSchema>;
type Context = Pick<OperationContext, "db" | "permissions">;

const sum = ({ values }: { values: readonly (number | null)[] }) => {
  const known = values.filter((value): value is number => value !== null);
  return known.length === 0 ? null : known.reduce((a, b) => a + b, 0);
};

/** Open tickets per open status now, with their estimated and confirmed value (ADR 0079). */
export async function statusTiles({ context }: { context: Context }): Promise<StatusTile[]> {
  const [statuses, tickets] = await Promise.all([
    context.db.ticketStatus.findMany({
      where: { status: "ACTIVE", closes: false },
      orderBy: { position: "asc" },
      select: { id: true, name: true, color: true },
    }),
    context.db.ticket.findMany({
      where: { status: "ACTIVE", ticketStatus: { closes: false } },
      select: { id: true, statusId: true },
    }),
  ]);
  const valuesOf = await cardValues({ context, ticketIds: tickets.map((ticket) => ticket.id) });
  return statuses.map(({ id, name, color }) => {
    const own = tickets.filter((ticket) => ticket.statusId === id);
    const values = own.map(({ id: ticketId }) => valuesOf({ ticketId }));
    return {
      statusId: id,
      name,
      color,
      tickets: own.length,
      // As on the board: the estimate counts only where there is no accepted quote (ADR 0074).
      estimatedValueMinor: sum({
        values: values.map((value) =>
          value.confirmedValueMinor === null ? value.estimatedValueMinor : null,
        ),
      }),
      confirmedValueMinor: sum({ values: values.map((value) => value.confirmedValueMinor) }),
    };
  });
}

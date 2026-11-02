import type { OperationContext } from "../../operations/types";
import type { UnsentSheet } from "./attention-schema";
import type { DashboardHorizon } from "./horizon";

type Context = Pick<OperationContext, "db">;

type Input = { context: Context; horizon: DashboardHorizon };

/** Every sheet version of open tickets with a line starting inside the horizon, newest first. */
function loadSheets({ context, horizon }: Input) {
  const inside = { status: "ACTIVE", startsAt: { gte: horizon.start, lt: horizon.end } } as const;
  return context.db.sheet.findMany({
    where: {
      ticket: { status: "ACTIVE", ticketStatus: { closes: false }, lines: { some: inside } },
    },
    orderBy: { version: "desc" },
    select: {
      id: true,
      ticketId: true,
      sheetDefinitionId: true,
      version: true,
      sentAt: true,
      sheetDefinition: { select: { name: true } },
      ticket: {
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
 * The newest version of each ticket's sheets when it is not sent, for open tickets with a line
 * starting inside the horizon (ADR 0080), soonest event first.
 */
export async function unsentSheets({ context, horizon }: Input): Promise<UnsentSheet[]> {
  const sheets = await loadSheets({ context, horizon });
  const newest = new Map<string, (typeof sheets)[number]>();
  for (const sheet of sheets) {
    const key = `${sheet.ticketId}:${sheet.sheetDefinitionId}`;
    if (!newest.has(key)) newest.set(key, sheet);
  }
  return [...newest.values()]
    .flatMap((sheet) => {
      const startsAt = sheet.ticket.lines[0]?.startsAt;
      if (sheet.sentAt || !startsAt) return [];
      const { id: sheetId, ticketId, version } = sheet;
      const { reference, title } = sheet.ticket;
      const { name } = sheet.sheetDefinition;
      return [{ sheetId, ticketId, reference, title, name, version, startsAt }];
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

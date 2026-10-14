import type { Prisma } from "@okazi/db";
import { LOG_LEVELS, type LogLevelName, type SystemLogListQuery } from "./schema";

type Filters = Omit<SystemLogListQuery, "page" | "pageSize">;

const atLeast = ({ level }: { level: LogLevelName }): string[] =>
  LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));

const contains = ({ q }: { q: string }): Prisma.SystemLogWhereInput => ({
  OR: [
    { event: { contains: q, mode: "insensitive" } },
    { msg: { contains: q, mode: "insensitive" } },
    { operation: { contains: q, mode: "insensitive" } },
  ],
});

export type SystemLogWhereInput = { filters: Filters };

/** List filters → Prisma `where`. Exact matches on ids so the indexes are used. */
export function systemLogWhere({ filters }: SystemLogWhereInput): Prisma.SystemLogWhereInput {
  const { level, q, requestId, organizationId, userId, surface, from, to } = filters;
  return {
    ...(level ? { level: { in: atLeast({ level }) } } : {}),
    ...(q ? contains({ q }) : {}),
    ...(requestId ? { requestId } : {}),
    ...(organizationId ? { organizationId } : {}),
    ...(userId ? { userId } : {}),
    ...(surface ? { surface } : {}),
    ...(from || to ? { time: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  };
}

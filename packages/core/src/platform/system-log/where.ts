import type { Prisma } from "@bibi/db";
import { parseQuery } from "../../shared/query/parse-query";
import { LOG_LEVELS, type LogLevelName, type SystemLogListQuery } from "./schema";
import { qualifierClause } from "./where-qualifiers";

export const SYSTEM_LOG_QUALIFIERS = [
  "level",
  "type",
  "surface",
  "request",
  "requestId",
  "operation",
  "status",
] as const;

export type SystemLogQualifier = (typeof SYSTEM_LOG_QUALIFIERS)[number];

type Filters = Omit<SystemLogListQuery, "page" | "pageSize" | "sort" | "direction">;

const atLeast = ({ level }: { level: LogLevelName }): string[] =>
  LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));

const contains = ({ q }: { q: string }): Prisma.SystemLogWhereInput => ({
  OR: [
    { event: { contains: q, mode: "insensitive" } },
    { msg: { contains: q, mode: "insensitive" } },
    { operation: { contains: q, mode: "insensitive" } },
  ],
});

function directFilters({ filters }: { filters: Filters }): Prisma.SystemLogWhereInput[] {
  const { level, surface, requestId, organizationId, userId, from, to } = filters;
  const clauses: Prisma.SystemLogWhereInput[] = [];
  if (level) clauses.push({ level: { in: atLeast({ level }) } });
  if (surface) clauses.push({ surface });
  if (requestId) clauses.push({ requestId });
  if (organizationId) clauses.push({ organizationId });
  if (userId) clauses.push({ userId });
  if (from || to) {
    clauses.push({
      time: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) },
    });
  }
  return clauses;
}

export type SystemLogWhereInput = { filters: Filters };

/** List filters → Prisma `where`. Supports qualifiers in `q` (`type:error`, `surface:web`, etc.). */
export function systemLogWhere({ filters }: SystemLogWhereInput): Prisma.SystemLogWhereInput {
  const parsed = parseQuery({ q: filters.q, qualifiers: SYSTEM_LOG_QUALIFIERS });
  const andClauses: Prisma.SystemLogWhereInput[] = [
    ...directFilters({ filters }),
    ...parsed.filters.flatMap((filter) => qualifierClause({ filter })),
  ];

  if (parsed.text) {
    andClauses.push(contains({ q: parsed.text }));
  }

  if (andClauses.length === 0) return {};
  if (andClauses.length === 1 && andClauses[0]) return andClauses[0];
  return { AND: andClauses };
}

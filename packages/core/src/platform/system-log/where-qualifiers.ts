import type { Prisma } from "@bibi/db";
import type { QueryFilter } from "../../shared/query/parse-query";
import { LOG_LEVELS, type LogLevelName } from "./schema";
import type { SystemLogQualifier } from "./where";

const atLeast = ({ level }: { level: LogLevelName }): string[] =>
  LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));

function levelClause({
  filter,
}: {
  filter: QueryFilter<SystemLogQualifier>;
}): Prisma.SystemLogWhereInput | null {
  const { values, negated } = filter;
  const valid = values
    .map((v) => v.toLowerCase())
    .filter((v): v is LogLevelName => LOG_LEVELS.includes(v as LogLevelName));
  if (valid.length === 0) return null;
  if (negated) return { level: { notIn: valid } };
  if (valid.length === 1 && valid[0]) return { level: { in: atLeast({ level: valid[0] }) } };
  return { level: { in: valid } };
}

function statusClause({
  filter,
}: {
  filter: QueryFilter<SystemLogQualifier>;
}): Prisma.SystemLogWhereInput | null {
  const numbers = filter.values.map(Number).filter((n) => !Number.isNaN(n));
  if (numbers.length === 0) return null;
  return filter.negated ? { status: { notIn: numbers } } : { status: { in: numbers } };
}

function operationClauses({
  filter,
}: {
  filter: QueryFilter<SystemLogQualifier>;
}): Prisma.SystemLogWhereInput[] {
  const { values, negated } = filter;
  return values.map((val) =>
    negated
      ? { operation: { not: { contains: val } } }
      : { operation: { contains: val, mode: "insensitive" } },
  );
}

export function qualifierClause({
  filter,
}: {
  filter: QueryFilter<SystemLogQualifier>;
}): Prisma.SystemLogWhereInput[] {
  const { key, values, negated } = filter;
  if (key === "level" || key === "type") {
    const clause = levelClause({ filter });
    return clause ? [clause] : [];
  }
  if (key === "surface") {
    return [negated ? { surface: { notIn: values } } : { surface: { in: values } }];
  }
  if (key === "request" || key === "requestId") {
    return [negated ? { requestId: { notIn: values } } : { requestId: { in: values } }];
  }
  if (key === "operation") return operationClauses({ filter });
  if (key === "status") {
    const clause = statusClause({ filter });
    return clause ? [clause] : [];
  }
  return [];
}

import type { AlternativeGroup } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { AlternativeGroupDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type ToGroupDtosInput = Db & { rows: readonly AlternativeGroup[] };

/** The groups with their active options in time order (one query for all of them). */
export async function toGroupDtos({
  context,
  rows,
}: ToGroupDtosInput): Promise<AlternativeGroupDto[]> {
  if (rows.length === 0) return [];
  const lines = await context.db.line.findMany({
    where: { alternativeGroupId: { in: rows.map((row) => row.id) } },
    orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, alternativeGroupId: true },
  });
  return rows.map((row) => ({
    ...row,
    optionLineIds: lines.filter((line) => line.alternativeGroupId === row.id).map((l) => l.id),
  }));
}

export type LoadGroupInput = Db & { id: string };

/** The active group, or null when missing, archived or in another organization. */
export async function loadGroup({
  context,
  id,
}: LoadGroupInput): Promise<AlternativeGroupDto | null> {
  const row = await context.db.alternativeGroup.findFirst({ where: { id } });
  if (!row) return null;
  const [dto] = await toGroupDtos({ context, rows: [row] });
  return dto ?? null;
}

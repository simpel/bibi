import type { OperationContext } from "../../operations/types";
import type { RequirementDto } from "./schema";
import { REQUIREMENT_INCLUDE, toRequirementDto } from "./to-requirement-dto";

/** One list value's count where it applies, and the requirement row it comes from. */
export type EffectiveCount = {
  vocabularyValueId: string;
  quantity: number;
  requirementId: string;
  /** `LINE` when the line's own row replaced the order's count. */
  level: "ORDER" | "LINE";
};

export type EffectiveForLine = { lineId: string; counts: EffectiveCount[] };

type Counted = Pick<RequirementDto, "id" | "lineId" | "vocabularyValueId" | "quantity">;

const toCount = ({ row }: { row: Counted }): EffectiveCount => ({
  vocabularyValueId: row.vocabularyValueId,
  quantity: row.quantity,
  requirementId: row.id,
  level: row.lineId ? "LINE" : "ORDER",
});

export type ResolveEffectiveInput = {
  lineIds: readonly string[];
  requirements: readonly Counted[];
};

/**
 * The effective count per list value for each line (ADR 0021): the order's count,
 * replaced value by value by the line's own row. A line row of 0 says "none
 * here" and still replaces the order's count. Pure, so run sheets and tests can reuse it.
 */
export function resolveEffective({
  lineIds,
  requirements,
}: ResolveEffectiveInput): EffectiveForLine[] {
  const order = requirements.filter((row) => !row.lineId);
  return lineIds.map((lineId) => {
    const byValue = new Map<string, EffectiveCount>();
    for (const row of order) byValue.set(row.vocabularyValueId, toCount({ row }));
    for (const row of requirements) {
      if (row.lineId === lineId) byValue.set(row.vocabularyValueId, toCount({ row }));
    }
    return { lineId, counts: [...byValue.values()] };
  });
}

export type EffectiveRequirementsInput = {
  context: Pick<OperationContext, "db">;
  orderId: string;
};

/** `resolveEffective` for every active line of the order, earliest first. */
export async function effectiveRequirements({
  context,
  orderId,
}: EffectiveRequirementsInput): Promise<EffectiveForLine[]> {
  const lines = await context.db.line.findMany({
    where: { orderId },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const rows = await context.db.requirement.findMany({
    where: { orderId },
    include: REQUIREMENT_INCLUDE,
  });
  return resolveEffective({
    lineIds: lines.map(({ id }) => id),
    requirements: rows.map((row) => toRequirementDto({ row })),
  });
}

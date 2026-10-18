import type { OperationContext } from "../../operations/types";
import type { RequirementDto } from "./schema";
import { toRequirementDto } from "./to-requirement-dto";

/** One list value's count where it applies, and the requirement row it comes from. */
export type EffectiveCount = {
  vocabularyValueId: string;
  quantity: number;
  requirementId: string;
  /** `PROGRAM_ITEM` when the program item's own row replaced the ticket's count. */
  level: "TICKET" | "PROGRAM_ITEM";
};

export type EffectiveForProgramItem = { programItemId: string; counts: EffectiveCount[] };

type Counted = Pick<RequirementDto, "id" | "programItemId" | "vocabularyValueId" | "quantity">;

const toCount = ({ row }: { row: Counted }): EffectiveCount => ({
  vocabularyValueId: row.vocabularyValueId,
  quantity: row.quantity,
  requirementId: row.id,
  level: row.programItemId ? "PROGRAM_ITEM" : "TICKET",
});

export type ResolveEffectiveInput = {
  programItemIds: readonly string[];
  requirements: readonly Counted[];
};

/**
 * The effective count per list value for each program item (ADR 0021): the ticket's count,
 * replaced value by value by the program item's own row. A program item row of 0 says "none
 * here" and still replaces the ticket's count. Pure, so sheets and tests can reuse it.
 */
export function resolveEffective({
  programItemIds,
  requirements,
}: ResolveEffectiveInput): EffectiveForProgramItem[] {
  const ticket = requirements.filter((row) => !row.programItemId);
  return programItemIds.map((programItemId) => {
    const byValue = new Map<string, EffectiveCount>();
    for (const row of ticket) byValue.set(row.vocabularyValueId, toCount({ row }));
    for (const row of requirements) {
      if (row.programItemId === programItemId) byValue.set(row.vocabularyValueId, toCount({ row }));
    }
    return { programItemId, counts: [...byValue.values()] };
  });
}

export type EffectiveRequirementsInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
};

/** `resolveEffective` for every active program item of the ticket, earliest first. */
export async function effectiveRequirements({
  context,
  ticketId,
}: EffectiveRequirementsInput): Promise<EffectiveForProgramItem[]> {
  const programItems = await context.db.programItem.findMany({
    where: { ticketId },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const rows = await context.db.requirement.findMany({ where: { ticketId } });
  return resolveEffective({
    programItemIds: programItems.map(({ id }) => id),
    requirements: rows.map((row) => toRequirementDto({ row })),
  });
}

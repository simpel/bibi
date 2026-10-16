import type { OperationContext } from "../../operations/types";
import type { RequirementDto } from "./schema";
import { toRequirementDto } from "./to-requirement-dto";

/** One list value's count where it applies, and the requirement row it comes from. */
export type EffectiveCount = {
  vocabularyValueId: string;
  quantity: number;
  requirementId: string;
  /** `PROGRAM_ITEM` when the program item's own row replaced the booking's count. */
  level: "BOOKING" | "PROGRAM_ITEM";
};

export type EffectiveForProgramItem = { programItemId: string; counts: EffectiveCount[] };

type Counted = Pick<RequirementDto, "id" | "programItemId" | "vocabularyValueId" | "quantity">;

const toCount = ({ row }: { row: Counted }): EffectiveCount => ({
  vocabularyValueId: row.vocabularyValueId,
  quantity: row.quantity,
  requirementId: row.id,
  level: row.programItemId ? "PROGRAM_ITEM" : "BOOKING",
});

export type ResolveEffectiveInput = {
  programItemIds: readonly string[];
  requirements: readonly Counted[];
};

/**
 * The effective count per list value for each program item (ADR 0021): the booking's count,
 * replaced value by value by the program item's own row. A program item row of 0 says "none
 * here" and still replaces the booking's count. Pure, so sheets and tests can reuse it.
 */
export function resolveEffective({
  programItemIds,
  requirements,
}: ResolveEffectiveInput): EffectiveForProgramItem[] {
  const booking = requirements.filter((row) => !row.programItemId);
  return programItemIds.map((programItemId) => {
    const byValue = new Map<string, EffectiveCount>();
    for (const row of booking) byValue.set(row.vocabularyValueId, toCount({ row }));
    for (const row of requirements) {
      if (row.programItemId === programItemId) byValue.set(row.vocabularyValueId, toCount({ row }));
    }
    return { programItemId, counts: [...byValue.values()] };
  });
}

export type EffectiveRequirementsInput = {
  context: Pick<OperationContext, "db">;
  bookingId: string;
};

/** `resolveEffective` for every active program item of the booking, earliest first. */
export async function effectiveRequirements({
  context,
  bookingId,
}: EffectiveRequirementsInput): Promise<EffectiveForProgramItem[]> {
  const programItems = await context.db.programItem.findMany({
    where: { bookingId },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const rows = await context.db.requirement.findMany({ where: { bookingId } });
  return resolveEffective({
    programItemIds: programItems.map(({ id }) => id),
    requirements: rows.map((row) => toRequirementDto({ row })),
  });
}

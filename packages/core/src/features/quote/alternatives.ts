import type { OperationContext } from "../../operations/types";
import type { DerivedLine } from "./derive-lines";

type Db = { context: Pick<OperationContext, "db"> };

/** The option with the lowest total excl. VAT; the first one on a tie. */
function cheapest({ options }: { options: readonly DerivedLine[] }) {
  let best: DerivedLine | undefined;
  for (const option of options) {
    if (!best || option.line.totalExclVatMinor < best.line.totalExclVatMinor) best = option;
  }
  return best?.line.lineId;
}

export type ApplyAlternativesInput = Db & { lines: readonly DerivedLine[] };

/**
 * ADR 0052: marks the priced lines that are options of an alternative group with the group's name
 * and whether it is chosen. Of each group only one line counts in the totals: the chosen option,
 * or until then the cheapest one (a "from" price). Changes the lines in place.
 */
export async function applyAlternatives({ context, lines }: ApplyAlternativesInput) {
  const ids = [...new Set(lines.flatMap(({ line }) => line.alternativeGroupId ?? []))];
  if (ids.length === 0) return;
  const groups = await context.db.alternativeGroup.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, chosenLineId: true },
  });
  const found = new Set(groups.map((group) => group.id));
  for (const { line } of lines) {
    if (line.alternativeGroupId && !found.has(line.alternativeGroupId)) {
      line.alternativeGroupId = null;
    }
  }
  for (const group of groups) {
    const options = lines.filter(({ line }) => line.alternativeGroupId === group.id);
    const counted = group.chosenLineId ?? cheapest({ options });
    for (const { line } of options) {
      line.alternativeGroupName = group.name;
      line.alternativeGroupChosen = group.chosenLineId !== null;
      line.inTotal = line.lineId === counted;
    }
  }
}

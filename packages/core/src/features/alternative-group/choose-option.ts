import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { releaseLineStates } from "../line/release-line-states";
import type { AlternativeGroupDto } from "./schema";
import { loadGroup } from "./to-group-dto";

export type ChooseOptionInput = {
  context: OperationContext;
  group: AlternativeGroupDto;
  lineId: string;
  /** Input path of the line id, for the issue (e.g. `chosenLineIds.0` on quote.accept). */
  path?: string;
};

/** The chosen line may not already be released (it would hold nothing and stay so). */
async function checkChosenLine({ context, lineId, path }: Omit<ChooseOptionInput, "group">) {
  const line = await context.db.line.findFirst({
    where: { id: lineId },
    select: { name: true, state: { select: { released: true } } },
  });
  if (!line?.state?.released) return ok({ value: true });
  const message = `"${line.name}" is released and cannot be chosen`;
  return conflict({ message, issues: [{ path: path ?? "lineId", message }] });
}

/**
 * Records the customer's pick (ADR 0052): the group's `chosenLineId` is set once, and every other
 * option moves to its item type's released state in the same transaction, which releases its hold
 * (ADR 0053). The released options are overridden, so phase moves skip them.
 */
export async function chooseOption({
  context,
  group,
  lineId,
  path = "lineId",
}: ChooseOptionInput): Promise<Result<AlternativeGroupDto>> {
  if (group.chosenLineId) return conflict({ message: `"${group.name}" is already chosen` });
  if (!group.optionLineIds.includes(lineId)) {
    const message = `The line is not an option of "${group.name}"`;
    return invalid({ message, issues: [{ path, message }] });
  }
  const chosen = await checkChosenLine({ context, lineId, path });
  if (!chosen.ok) return chosen;
  const claimed = await context.db.alternativeGroup.updateMany({
    where: { id: group.id, chosenLineId: null },
    data: { chosenLineId: lineId },
  });
  if (claimed.count === 0) return conflict({ message: `"${group.name}" is already chosen` });
  const others = group.optionLineIds.filter((id) => id !== lineId);
  const { ticketId } = group;
  const released = await releaseLineStates({
    context,
    ticketId,
    lineIds: others,
    overridden: true,
  });
  if (!released.ok) return released;
  const after = await loadGroup({ context, id: group.id });
  if (!after) return notFound({ entity: "Alternative group" });
  context.recordChange({
    entityType: "alternativeGroup",
    entityId: group.id,
    before: group,
    after,
  });
  return ok({ value: after });
}

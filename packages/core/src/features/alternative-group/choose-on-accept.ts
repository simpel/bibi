import { ok, type Result } from "../../errors/result";
import { authorize } from "../../operations/authorize";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { chooseOption } from "./choose-option";
import { chooseAlternative } from "./operations";
import { toGroupDtos } from "./to-group-dto";

export type ChooseOnAcceptInput = {
  context: OperationContext;
  ticketId: string;
  /** Per open group of the ticket, at most one of its options. */
  chosenLineIds: readonly string[];
};

/**
 * `quote.accept` with the customer's picks (ADR 0052): each line id must be an option of a group of
 * the ticket that is not chosen yet, at most one per group (`VALIDATION` on `chosenLineIds.N`).
 * Each pick then goes through `chooseOption`, which releases the other options; the caller needs
 * `alternativeGroup.choose`'s permission (`line:write`).
 */
export async function chooseOnAccept({
  context,
  ticketId,
  chosenLineIds,
}: ChooseOnAcceptInput): Promise<Result<true>> {
  if (chosenLineIds.length === 0) return ok({ value: true });
  // As the acting user: picking an option needs alternativeGroup.choose's permission.
  const allowed = authorize({ operation: chooseAlternative, context });
  if (!allowed.ok) return allowed;
  const rows = await context.db.alternativeGroup.findMany({
    where: { ticketId, chosenLineId: null },
  });
  const groups = await toGroupDtos({ context, rows });
  const used = new Set<string>();
  for (const [at, lineId] of chosenLineIds.entries()) {
    const path = `chosenLineIds.${at}`;
    const group = groups.find((candidate) => candidate.optionLineIds.includes(lineId));
    if (!group || used.has(group.id)) {
      const message = group
        ? `Only one option of "${group.name}" can be chosen`
        : "The line is not an option of an alternative group of the ticket that is not chosen yet";
      return invalid({ message, issues: [{ path, message }] });
    }
    used.add(group.id);
    const chosen = await chooseOption({ context, group, lineId, path });
    if (!chosen.ok) return chosen;
  }
  return ok({ value: true });
}

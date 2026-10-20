import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkTicket } from "../line/line-rules";
import { checkOptions } from "./group-rules";
import type {
  AlternativeGroupCreateInput,
  AlternativeGroupDto,
  AlternativeGroupUpdateInput,
} from "./schema";
import { setOptions } from "./set-options";
import { loadGroup } from "./to-group-dto";

type Command<I> = { input: I; context: OperationContext };
type GroupResult = Promise<Result<AlternativeGroupDto>>;

/** `alternativeGroup.create`: a new group of two or more lines of the ticket. */
export async function insertGroup({ input, context }: Command<AlternativeGroupCreateInput>) {
  const { ticketId, name, lineIds } = input;
  const ticket = await checkTicket({ context, ticketId });
  if (!ticket.ok) return ticket;
  const options = await checkOptions({ context, ticketId, lineIds });
  if (!options.ok) return options;
  const row = await context.db.alternativeGroup.create({
    data: { ticketId, name, organizationId: context.organizationId },
  });
  const set = await setOptions({ context, groupId: row.id, lineIds });
  if (!set.ok) return set;
  const group = await loadGroup({ context, id: row.id });
  if (!group) return notFound({ entity: "Alternative group" });
  context.recordChange({ entityId: row.id, before: null, after: group });
  return ok({ value: group });
}

/** `alternativeGroup.update`: rename, or replace the options before one is chosen. */
export async function changeGroup({
  input: { id, name, lineIds },
  context,
}: Command<AlternativeGroupUpdateInput>): GroupResult {
  const before = await loadGroup({ context, id });
  if (!before) return notFound({ entity: "Alternative group" });
  if (lineIds) {
    if (before.chosenLineId) return conflict({ message: "An option is already chosen" });
    const ticketId = before.ticketId;
    const options = await checkOptions({ context, ticketId, lineIds, groupId: id });
    if (!options.ok) return options;
    const set = await setOptions({ context, groupId: id, lineIds });
    if (!set.ok) return set;
  }
  if (name !== undefined)
    await context.db.alternativeGroup.update({ where: { id }, data: { name } });
  const after = await loadGroup({ context, id });
  if (!after) return notFound({ entity: "Alternative group" });
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
}

/** `alternativeGroup.archive`: the options become ordinary lines and keep their states. */
export async function dissolveGroup({ input: { id }, context }: Command<{ id: string }>) {
  const before = await loadGroup({ context, id });
  if (!before) return notFound({ entity: "Alternative group" });
  await context.db.line.updateMany({
    where: { alternativeGroupId: id },
    data: { alternativeGroupId: null },
  });
  const row = await context.db.alternativeGroup.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  const after: AlternativeGroupDto = { ...row, optionLineIds: [] };
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
}

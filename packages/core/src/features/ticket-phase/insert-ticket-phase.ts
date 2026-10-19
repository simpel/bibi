import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { checkFlagCombination, handOverEntry, handOverEvent } from "./flag-rules";
import { toTicketPhaseDto } from "./load-ticket-phase";
import type { TicketPhaseCreateInput, TicketPhaseDto } from "./schema";

export type InsertTicketPhaseInput = { context: OperationContext } & TicketPhaseCreateInput;

export type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

/** True when another active phase already has this name. */
export async function ticketPhaseNameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.ticketPhase.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

export const nameTaken = ({ name }: { name: string }) =>
  conflict({ message: `A ticket phase named "${name}" exists` });

/** The position after the last active phase. */
async function lastPosition({ context }: { context: Pick<OperationContext, "db"> }) {
  const last = await context.db.ticketPhase.findFirst({ orderBy: { position: "desc" } });
  return last ? last.position + 1 : 0;
}

/** Shared by `ticketPhase.create` and `.importTemplate`: unique name, flags, insert, record. */
export async function insertTicketPhase({
  context,
  ...input
}: InsertTicketPhaseInput): Promise<Result<TicketPhaseDto>> {
  if (await ticketPhaseNameTaken({ context, name: input.name })) {
    return nameTaken({ name: input.name });
  }
  const flags = checkFlagCombination({ flags: input });
  if (!flags.ok) return flags;
  const position = await lastPosition({ context });
  // The current entry phase gives up its flag first: one active entry phase is a unique index.
  if (input.entry) await handOverEntry({ context, id: null });
  if (input.event) await handOverEvent({ context, event: input.event, id: null });
  const row = await context.db.ticketPhase.create({
    data: { ...input, position, organizationId: context.organizationId },
  });
  const phase = toTicketPhaseDto({ row: { ...row, transitionsFrom: [] } });
  context.recordChange({ entityId: row.id, after: phase });
  return ok({ value: phase });
}

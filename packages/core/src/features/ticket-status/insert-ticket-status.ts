import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { type PlaceNewStatusInput, placeNewStatus } from "../board/status-placement";
import { checkFlagCombination, handOverEntry, handOverEvent } from "./flag-rules";
import { toTicketStatusDto } from "./load-ticket-status";
import type {
  StatusEvent,
  TicketStatusCreateInput,
  TicketStatusDto,
  TicketStatusFlags,
} from "./schema";

/** A create's fields plus the flags and event a template import sets in the same step. */
export type InsertTicketStatusInput = { context: OperationContext } & TicketStatusCreateInput &
  Partial<TicketStatusFlags> & { event?: StatusEvent | null } & Pick<
    PlaceNewStatusInput,
    "ownPhase"
  >;

export type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

/** True when another active status already has this name. */
export async function ticketStatusNameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.ticketStatus.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

export const nameTaken = ({ name }: { name: string }) =>
  conflict({ message: `A ticket status named "${name}" exists` });

/** The position after the last active status. */
async function lastPosition({ context }: { context: Pick<OperationContext, "db"> }) {
  const last = await context.db.ticketStatus.findFirst({ orderBy: { position: "desc" } });
  return last ? last.position + 1 : 0;
}

/** Shared by `ticketStatus.create` and `.importTemplate`: unique name, flags, insert, record. */
export async function insertTicketStatus({
  context,
  phaseId,
  ownPhase,
  ...input
}: InsertTicketStatusInput): Promise<Result<TicketStatusDto>> {
  if (await ticketStatusNameTaken({ context, name: input.name })) {
    return nameTaken({ name: input.name });
  }
  const flags = checkFlagCombination({ flags: input });
  if (!flags.ok) return flags;
  const position = await lastPosition({ context });
  // The current entry status gives up its flag first: one active entry status is a unique index.
  if (input.entry) await handOverEntry({ context, id: null });
  if (input.event) await handOverEvent({ context, event: input.event, id: null });
  const row = await context.db.ticketStatus.create({
    data: { ...input, position, organizationId: context.organizationId },
  });
  const placed = await placeNewStatus({ context, status: row, phaseId, ownPhase });
  if (!placed.ok) return placed;
  const ticketStatus = toTicketStatusDto({ row: { ...row, transitionsFrom: [] } });
  context.recordChange({ entityId: row.id, after: ticketStatus });
  return ok({ value: ticketStatus });
}

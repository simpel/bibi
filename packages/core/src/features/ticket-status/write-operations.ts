import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import {
  checkFlagCombination,
  checkMinimumConfiguration,
  handOverEntry,
  handOverEvent,
  serializeStatusChanges,
} from "./flag-rules";
import { insertTicketStatus, nameTaken, ticketStatusNameTaken } from "./insert-ticket-status";
import { loadAllTicketStatuses, loadTicketStatus } from "./load-ticket-status";
import {
  STATUS_FLAGS,
  type StatusEvent,
  TicketStatusCreateInputSchema,
  type TicketStatusDto,
  type TicketStatusFlags,
  TicketStatusSchema,
  type TicketStatusUpdateInput,
  TicketStatusUpdateInputSchema,
} from "./schema";

export const createTicketStatus = defineOperation({
  name: "ticketStatus.create",
  kind: "command",
  description:
    "Create a ticket status: a name, a hex color and its flags (entry, closing, " +
    "requiresReason, requiresAssignee, requiresAcceptedQuote, invoiceable; all false by default) " +
    "and an optional quote " +
    "`event` (QUOTE_SENT or QUOTE_ACCEPTED: quote.send and quote.accept move tickets here; at " +
    "most one status per event, so it is taken from the status that had it). It is placed last. " +
    "It shows in `phaseId` when given, otherwise on no board until moved onto one " +
    "(boardPhase.moveStatus). " +
    "A new entry status takes the entry flag from the current one. Allow moves to and from it " +
    "with ticketStatus.setTransitions.",
  input: TicketStatusCreateInputSchema,
  output: TicketStatusSchema,
  permission: "pipeline:write",
  handler: ({ input, context }) => insertTicketStatus({ context, ...input, ownPhase: false }),
});

type FlagsAfterInput = { before: TicketStatusDto; data: Omit<TicketStatusUpdateInput, "id"> };

const flagsAfter = ({ before, data }: FlagsAfterInput): TicketStatusFlags =>
  Object.fromEntries(
    STATUS_FLAGS.map((flag) => [flag, data[flag] ?? before[flag]]),
  ) as TicketStatusFlags;

type ApplyInput = {
  context: OperationContext;
  before: TicketStatusDto;
  flags: TicketStatusFlags;
  event: StatusEvent | null | undefined;
};

/**
 * Side effects of new flags: the entry flag and a quote event move here, a closing status loses
 * its exits.
 */
async function applyFlagEffects({ context, before, flags, event }: ApplyInput) {
  if (event && event !== before.event) await handOverEvent({ context, event, id: before.id });
  if (flags.entry && !before.entry) await handOverEntry({ context, id: before.id });
  if (flags.closes && !before.closes) {
    await context.db.ticketStatusTransition.deleteMany({ where: { fromStatusId: before.id } });
  }
}

export const updateTicketStatus = defineOperation({
  name: "ticketStatus.update",
  kind: "command",
  description:
    "Rename or recolor a ticket status, or change its flags. Renaming and recoloring change no " +
    "behavior. Making a status the entry status takes the flag from the current one; making it " +
    "closing removes its transitions out; setting an `event` takes it from the status that had it " +
    "(null clears it). A change that leaves the organization without an " +
    "entry or a closing status is a CONFLICT.",
  input: TicketStatusUpdateInputSchema,
  output: TicketStatusSchema,
  permission: "pipeline:write",
  handler: async ({ input: { id, ...data }, context }) => {
    await serializeStatusChanges({ context });
    const before = await loadTicketStatus({ context, id });
    if (!before) return notFound({ entity: "Ticket status" });
    const { name } = data;
    if (name !== undefined && name !== before.name) {
      if (await ticketStatusNameTaken({ context, name, id })) return nameTaken({ name });
    }
    const flags = flagsAfter({ before, data });
    for (const check of [
      checkFlagCombination({ flags }),
      checkMinimumConfiguration({
        statuses: await loadAllTicketStatuses({ context }),
        id,
        after: flags,
      }),
    ]) {
      if (!check.ok) return check;
    }
    await applyFlagEffects({ context, before, flags, event: data.event });
    await context.db.ticketStatus.update({ where: { id }, data });
    const after = await loadTicketStatus({ context, id });
    if (!after) return notFound({ entity: "Ticket status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

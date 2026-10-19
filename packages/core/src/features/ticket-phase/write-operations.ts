import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import {
  checkFlagCombination,
  checkMinimumConfiguration,
  handOverEntry,
  handOverEvent,
  serializePhaseChanges,
} from "./flag-rules";
import { insertTicketPhase, nameTaken, ticketPhaseNameTaken } from "./insert-ticket-phase";
import { loadAllTicketPhases, loadTicketPhase } from "./load-ticket-phase";
import {
  PHASE_FLAGS,
  type PhaseEvent,
  TicketPhaseCreateInputSchema,
  type TicketPhaseDto,
  type TicketPhaseFlags,
  TicketPhaseSchema,
  type TicketPhaseUpdateInput,
  TicketPhaseUpdateInputSchema,
} from "./schema";

export const createTicketPhase = defineOperation({
  name: "ticketPhase.create",
  kind: "command",
  description:
    "Create a ticket phase: a name, a hex color and its flags (entry, terminal, " +
    "requiresReason, requiresAssignee, invoiceable; all false by default) and an optional quote " +
    "`event` (QUOTE_SENT or QUOTE_ACCEPTED: quote.send and quote.accept move tickets here; at " +
    "most one phase per event, so it is taken from the phase that had it). It is placed last. " +
    "A new entry phase takes the entry flag from the current one. Allow moves to and from it " +
    "with ticketPhase.setTransitions.",
  input: TicketPhaseCreateInputSchema,
  output: TicketPhaseSchema,
  permission: "pipeline:create",
  handler: ({ input, context }) => insertTicketPhase({ context, ...input }),
});

type FlagsAfterInput = { before: TicketPhaseDto; data: Omit<TicketPhaseUpdateInput, "id"> };

const flagsAfter = ({ before, data }: FlagsAfterInput): TicketPhaseFlags =>
  Object.fromEntries(
    PHASE_FLAGS.map((flag) => [flag, data[flag] ?? before[flag]]),
  ) as TicketPhaseFlags;

type ApplyInput = {
  context: OperationContext;
  before: TicketPhaseDto;
  flags: TicketPhaseFlags;
  event: PhaseEvent | null | undefined;
};

/**
 * Side effects of new flags: the entry flag and a quote event move here, a terminal phase loses
 * its exits.
 */
async function applyFlagEffects({ context, before, flags, event }: ApplyInput) {
  if (event && event !== before.event) await handOverEvent({ context, event, id: before.id });
  if (flags.entry && !before.entry) await handOverEntry({ context, id: before.id });
  if (flags.terminal && !before.terminal) {
    await context.db.ticketPhaseTransition.deleteMany({ where: { fromPhaseId: before.id } });
  }
}

export const updateTicketPhase = defineOperation({
  name: "ticketPhase.update",
  kind: "command",
  description:
    "Rename or recolor a ticket phase, or change its flags. Renaming and recoloring change no " +
    "behavior. Making a phase the entry phase takes the flag from the current one; making it " +
    "terminal removes its transitions out; setting an `event` takes it from the phase that had it " +
    "(null clears it). A change that leaves the organization without an " +
    "entry or a terminal phase is a CONFLICT.",
  input: TicketPhaseUpdateInputSchema,
  output: TicketPhaseSchema,
  permission: "pipeline:edit",
  handler: async ({ input: { id, ...data }, context }) => {
    await serializePhaseChanges({ context });
    const before = await loadTicketPhase({ context, id });
    if (!before) return notFound({ entity: "Ticket phase" });
    const { name } = data;
    if (name !== undefined && name !== before.name) {
      if (await ticketPhaseNameTaken({ context, name, id })) return nameTaken({ name });
    }
    const flags = flagsAfter({ before, data });
    for (const check of [
      checkFlagCombination({ flags }),
      checkMinimumConfiguration({
        phases: await loadAllTicketPhases({ context }),
        id,
        after: flags,
      }),
    ]) {
      if (!check.ok) return check;
    }
    await applyFlagEffects({ context, before, flags, event: data.event });
    await context.db.ticketPhase.update({ where: { id }, data });
    const after = await loadTicketPhase({ context, id });
    if (!after) return notFound({ entity: "Ticket phase" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

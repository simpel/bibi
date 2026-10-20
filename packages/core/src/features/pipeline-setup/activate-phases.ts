import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { forwardTransitions } from "../../templates/ticket-phases/ticket-phase-template";
import { archiveTicketPhase } from "../ticket-phase/archive-operation";
import { loadAllTicketPhases } from "../ticket-phase/load-ticket-phase";
import { reorderTicketPhases, setTicketPhaseTransitions } from "../ticket-phase/order-operations";
import { createTicketPhase, updateTicketPhase } from "../ticket-phase/write-operations";
import type { PipelinePhaseDraft } from "./schema";

type PhasesInput = { context: OperationContext; phases: readonly PipelinePhaseDraft[] };

const flagsOf = ({ phase }: { phase: PipelinePhaseDraft }) => ({
  color: phase.color,
  entry: phase.entry ?? false,
  terminal: phase.terminal ?? false,
  requiresReason: phase.requiresReason ?? false,
  requiresAssignee: phase.requiresAssignee ?? false,
  requiresAcceptedQuote: phase.requiresAcceptedQuote ?? false,
  invoiceable: phase.invoiceable ?? false,
  event: phase.event ?? null,
});

/** Entry first, then terminal phases: no step leaves the organization without either. */
const rank = ({ phase }: { phase: PipelinePhaseDraft }) =>
  phase.entry ? 0 : phase.terminal ? 1 : 2;

/** Creates or updates (by name) every phase of the draft; returns their ids by name. */
export async function upsertPhases({
  context,
  phases,
}: PhasesInput): Promise<Result<Map<string, string>>> {
  const existing = await loadAllTicketPhases({ context });
  const ordered = [...phases].sort((a, b) => rank({ phase: a }) - rank({ phase: b }));
  const ids = new Map<string, string>();
  for (const phase of ordered) {
    const found = existing.find((row) => row.name === phase.name);
    const saved = found
      ? await runNested({
          operation: updateTicketPhase,
          input: { id: found.id, ...flagsOf({ phase }) },
          context,
        })
      : await runNested({
          operation: createTicketPhase,
          input: { name: phase.name, ...flagsOf({ phase }) },
          context,
        });
    if (!saved.ok) return saved;
    ids.set(phase.name, saved.value.id);
  }
  return ok({ value: ids });
}

type FinishInput = PhasesInput & { ids: Map<string, string> };

/**
 * Archives the phases the draft left out (their tickets move to the entry phase through the
 * normal move checks), then sets the draft's order and the default transitions (ADR 0043).
 */
export async function finishPhases({ context, phases, ids }: FinishInput): Promise<Result<true>> {
  const idOf = ({ name }: { name: string }) => ids.get(name) ?? "";
  const entry = phases.find((phase) => phase.entry);
  const targetPhaseId = entry ? idOf({ name: entry.name }) : undefined;
  const existing = await loadAllTicketPhases({ context });
  const kept = new Set(ids.values());
  for (const row of existing.filter((candidate) => !kept.has(candidate.id))) {
    const input = { id: row.id, ...(targetPhaseId ? { targetPhaseId } : {}) };
    const archived = await runNested({ operation: archiveTicketPhase, input, context });
    if (!archived.ok) return archived;
  }
  const order = { ids: phases.map((phase) => idOf({ name: phase.name })) };
  const reordered = await runNested({ operation: reorderTicketPhases, input: order, context });
  if (!reordered.ok) return reordered;
  const pairs = forwardTransitions({ phases });
  for (const phase of phases) {
    const toPhaseIds = pairs
      .filter(([from]) => from === phase.name)
      .map(([, to]) => idOf({ name: to }));
    const input = { id: idOf({ name: phase.name }), toPhaseIds };
    const set = await runNested({ operation: setTicketPhaseTransitions, input, context });
    if (!set.ok) return set;
  }
  return ok({ value: true });
}

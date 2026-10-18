import type { TicketPhaseFlags } from "../../features/ticket-phase/schema";

export type TicketPhaseTemplatePhase = { name: string; color: string } & Partial<TicketPhaseFlags>;

/**
 * Ticket phases an organization can import and then edit freely (ADR 0043). Domain words live
 * only in this data. `transitions` name the phases: `[from, to]`.
 */
export type TicketPhaseTemplate = {
  key: string;
  name: string;
  phases: readonly TicketPhaseTemplatePhase[];
  transitions: readonly (readonly [string, string])[];
};

export type ForwardTransitionsInput = { phases: readonly TicketPhaseTemplatePhase[] };

/**
 * The default transitions (ADR 0043): every move forward plus a move to any terminal phase, and
 * nothing out of a terminal phase.
 */
export function forwardTransitions({ phases }: ForwardTransitionsInput): [string, string][] {
  return phases.flatMap((from, index) =>
    from.terminal
      ? []
      : phases
          .filter((to, toIndex) => to !== from && (toIndex > index || to.terminal))
          .map((to): [string, string] => [from.name, to.name]),
  );
}

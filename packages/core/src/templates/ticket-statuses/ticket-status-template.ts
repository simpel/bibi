import type { TransitionGate } from "../../features/ticket-status/gate-schema";
import type { StatusEvent, TicketStatusFlags } from "../../features/ticket-status/schema";

export type TicketStatusTemplateStatus = {
  name: string;
  color: string;
  event?: StatusEvent | null;
  /** The gates on moves into this status from any status (ADR 0076), e.g. a reason for Lost. */
  gatesIn?: readonly TransitionGate[];
} & Partial<TicketStatusFlags>;

/**
 * Ticket statuses an organization can import and then edit freely (ADR 0043). Domain words live
 * only in this data. Tickets move freely between a template's statuses (ADR 0076).
 */
export type TicketStatusTemplate = {
  key: string;
  name: string;
  statuses: readonly TicketStatusTemplateStatus[];
};

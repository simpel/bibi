import { TicketCardView } from "./ticket-card-view";
import { TicketEstimateHistoryView } from "./ticket-estimate-history-view";
import { TicketStatusHistoryView } from "./ticket-status-history-view";
import { TicketTableView } from "./ticket-table-view";

/** The ticket's own cards: list, card and its histories (ADR 0054, 0074), part of `GENERATIVE_COMPONENTS`. */
export const TICKET_COMPONENTS = {
  "ticket-table": TicketTableView,
  "ticket-card": TicketCardView,
  "ticket-status-history": TicketStatusHistoryView,
  "ticket-estimate-history": TicketEstimateHistoryView,
} as const;

import { archiveTicketPhase } from "./archive-operation";
import { previewArchiveTicketPhase } from "./archive-preview-operation";
import { importTicketPhaseTemplate } from "./import-template-operation";
import { reorderTicketPhases, setTicketPhaseTransitions } from "./order-operations";
import { getTicketPhase, listTicketPhases } from "./read-operations";
import { createTicketPhase, updateTicketPhase } from "./write-operations";

/** Every ticket phase operation (ADR 0043); implementations live in the sibling files. */
export const ticketPhaseOperations = [
  listTicketPhases,
  getTicketPhase,
  createTicketPhase,
  updateTicketPhase,
  archiveTicketPhase,
  previewArchiveTicketPhase,
  reorderTicketPhases,
  setTicketPhaseTransitions,
  importTicketPhaseTemplate,
];

import { archiveTicketStatus } from "./archive-operation";
import { previewArchiveTicketStatus } from "./archive-preview-operation";
import { importTicketStatusTemplate } from "./import-template-operation";
import { reorderTicketStatuses, setTicketStatusTransitions } from "./order-operations";
import { getTicketStatus, listTicketStatuses } from "./read-operations";
import { createTicketStatus, updateTicketStatus } from "./write-operations";

/** Every ticket status operation (ADR 0043); implementations live in the sibling files. */
export const ticketStatusOperations = [
  listTicketStatuses,
  getTicketStatus,
  createTicketStatus,
  updateTicketStatus,
  archiveTicketStatus,
  previewArchiveTicketStatus,
  reorderTicketStatuses,
  setTicketStatusTransitions,
  importTicketStatusTemplate,
];

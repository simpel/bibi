import { importBookingStatusTemplate } from "./import-template-operation";
import { reorderBookingStatuses, setBookingStatusTransitions } from "./order-operations";
import { getBookingStatus, listBookingStatuses } from "./read-operations";
import { archiveBookingStatus, createBookingStatus, updateBookingStatus } from "./write-operations";

/** Every booking status operation (ADR 0022); implementations live in the sibling files. */
export const bookingStatusOperations = [
  listBookingStatuses,
  getBookingStatus,
  createBookingStatus,
  updateBookingStatus,
  archiveBookingStatus,
  reorderBookingStatuses,
  setBookingStatusTransitions,
  importBookingStatusTemplate,
];

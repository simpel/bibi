/** Reservation and table block commands (ADR 0119) with a label in `assistant.approval.operations`. */
export const RESERVATION_OPERATION_KEYS = [
  "reservation_create",
  "reservation_update",
  "reservation_cancel",
  "reservation_seat",
  "reservation_unseat",
  "reservation_complete",
  "reservation_markNoShow",
  "tableBlock_create",
  "tableBlock_delete",
] as const;

/** Reservation input fields with a label in `assistant.approval.fields` (shared ones live elsewhere). */
export const RESERVATION_FIELD_KEYS = [
  "partySize",
  "durationMinutes",
  "tableIds",
  "bookerName",
  "bookerPhone",
  "bookerEmail",
  "requirements",
] as const;

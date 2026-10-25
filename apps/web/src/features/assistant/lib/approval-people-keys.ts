/** Fields of the member profile commands (ADR 0068) with a label in `assistant.approval.fields`. */
export const PEOPLE_FIELD_KEYS = ["memberId", "scheduleKind", "itemIds"] as const;

/** Assignment and member profile commands with a label in `assistant.approval.operations`. */
export const PEOPLE_OPERATION_KEYS = [
  "assignment_assign",
  "assignment_follow",
  "assignment_unfollow",
  "memberProfile_update",
  "memberProfile_setItems",
] as const;

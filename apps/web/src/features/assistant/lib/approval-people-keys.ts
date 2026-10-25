/**
 * Fields of the member profile commands (ADR 0068) and of a user's own settings (ADR 0046) with a
 * label in `assistant.approval.fields`.
 */
export const PEOPLE_FIELD_KEYS = [
  "memberId",
  "scheduleKind",
  "itemIds",
  "dateFormat",
  "clockFormat",
] as const;

/** Assignment, member profile and own settings commands with a label in `assistant.approval.operations`. */
export const PEOPLE_OPERATION_KEYS = [
  "assignment_assign",
  "assignment_follow",
  "assignment_unfollow",
  "memberProfile_update",
  "memberProfile_setItems",
  "userSettings_update",
] as const;

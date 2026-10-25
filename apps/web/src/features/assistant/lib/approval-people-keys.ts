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
  "numberFormat",
  "currencyDisplay",
  "days",
  "exceptions",
] as const;

/** Assignment, member profile and own settings commands with a label in `assistant.approval.operations`. */
export const PEOPLE_OPERATION_KEYS = [
  "assignment_assign",
  "assignment_follow",
  "assignment_unfollow",
  "memberProfile_update",
  "memberProfile_setItems",
  "userSettings_update",
  "venueHours_set",
  "itemHours_set",
] as const;

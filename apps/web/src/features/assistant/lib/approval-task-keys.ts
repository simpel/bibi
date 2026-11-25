/** Task commands (ADR 0117) with a localized label in `assistant.approval.operations`. */
export const TASK_OPERATION_KEYS = [
  "task_create",
  "task_update",
  "task_complete",
  "task_reopen",
  "task_linkOrder",
  "task_archive",
] as const;

/** Task input fields with a localized label in `assistant.approval.fields`. */
export const TASK_FIELD_KEYS = ["endsAt", "note", "taskId", "taskIds", "taskShape"] as const;

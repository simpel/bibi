import type { IntakeTaskRef, IntakeWho } from "./intake-state";

/** The task an intake was opened from (`?fromTask=<id>`, ADR 0117): who it is for and its note. */
export type IntakeTask = IntakeTaskRef & { who: IntakeWho };

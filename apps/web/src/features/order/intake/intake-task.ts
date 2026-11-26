import type { IntakeTaskRef, IntakeWho } from "./intake-state";

/**
 * The task an intake was opened from (`?fromTask=<id>`, ADR 0117): who it is for and its note.
 * `who` is null when the task has no customer or no contact (ADR 0120): step 1 is then asked.
 */
export type IntakeTask = IntakeTaskRef & {
  who: IntakeWho | null;
  /** Its prebooked and booked rooms (ADR 0120): Create carries them over as lines in that hold. */
  rooms: IntakeTaskRoom[];
};

/** A room the task holds; the item's name is null without `item:read`. */
export type IntakeTaskRoom = {
  itemId: string;
  name: string | null;
  hold: "PREBOOK" | "BOOK";
  startsAt: Date;
  endsAt: Date;
};

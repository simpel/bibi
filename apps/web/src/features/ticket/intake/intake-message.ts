/** The inbox message an intake was opened from (`?fromMessage=<id>`, ADR 0085). */
export type IntakeMessage = {
  id: string;
  /** Who sent it, as shown in the banner. */
  sender: string;
  /** What the customer search starts with, or null. */
  search: string | null;
  /** Its text, which step 0 starts with (ADR 0084). */
  text: string;
};

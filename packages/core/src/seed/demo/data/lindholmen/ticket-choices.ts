import type { DemoChoice, DemoLine } from "../../ticket-types";

/**
 * ADR 0055: the only stored responsibility choices of Lindholmen's tickets (on L11). Head of
 * kitchen answers as Johan instead of the default Ali, and Maria leaves Coordinator's default
 * followers. Every other ticket follows the defaults.
 */
export const l11Choices: readonly DemoChoice[] = [
  { responsibility: "Head of kitchen", assignee: "Johan Ek" },
  { responsibility: "Coordinator", unfollow: "Maria Holm" },
];

/**
 * L4's lines: the room, and a sound system that brings a technician from the pool of two for its
 * setup and teardown (ADR 0059, check 15). Kept here so `tickets.ts` fits its file.
 */
export const l4Lines: readonly DemoLine[] = [
  { item: "Styrsö", name: "Half-day conference", from: "09:00", to: "13:00" },
  { item: "Mobile sound system", name: "Sound for the conference", from: "09:00", to: "13:00" },
];

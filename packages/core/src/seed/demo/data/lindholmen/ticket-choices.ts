import type { DemoChoice } from "../../ticket-types";

/**
 * ADR 0055: the only stored responsibility choices of Lindholmen's tickets (on L11). Head of
 * kitchen answers as Johan instead of the default Ali, and Maria leaves Coordinator's default
 * followers. Every other ticket follows the defaults.
 */
export const l11Choices: readonly DemoChoice[] = [
  { responsibility: "Head of kitchen", assignee: "Johan Ek" },
  { responsibility: "Coordinator", unfollow: "Maria Holm" },
];

/**
 * Every dismissible help hint and finished page tour (`tour-*`), by id (spec: help hints). A hint the user closes is stored as the
 * preference `help.dismissed.<id>` and never shows again for them, on any device. Rename an id
 * only to show the hint again to everyone.
 */
export const HELP_HINT_IDS = [
  "card-legend",
  "calendar-legend",
  "setup-preview-legend",
  "assistant-approval",
  "quote-draft",
  "inbox-address",
  "dashboard",
  "forecast",
  "tour-my-work",
  "tour-calendar",
  "tour-pipeline",
  "tour-order",
  "tour-run-sheet",
  "tour-admin-pipeline",
  "tour-permissions",
  "tour-item-type",
  "tour-run-sheet-definition",
  "tour-board-customize",
] as const;

export type HelpHintId = (typeof HELP_HINT_IDS)[number];

export const HELP_DISMISSED_PREFIX = "help.dismissed.";

export const helpDismissedKey = ({ id }: { id: HelpHintId }) => `${HELP_DISMISSED_PREFIX}${id}`;

/** The hints the user has closed, from their `help.dismissed.*` preferences. */
export function dismissedHints({ preferences }: { preferences: Record<string, unknown> }) {
  return HELP_HINT_IDS.filter((id) => preferences[helpDismissedKey({ id })] === true);
}

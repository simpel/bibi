import type { ApprovalRequired } from "../approval/approval-schema";
import type { RoomWire, SearchHitWire, SkillCardWire, SkillRow, VenueWire } from "./wire-schemas";

/**
 * Generative-UI contract: component key → props. The web maps each key to an `@okazi/ui`
 * component; this package only decides which key and validated props a tool result gets.
 */
export type ToolUiProps = {
  "venue-table": { items: VenueWire[]; nextCursor: string | null };
  "venue-card": { venue: VenueWire };
  "room-table": { items: RoomWire[]; nextCursor: string | null };
  "room-card": { room: RoomWire };
  "search-results": { hits: SearchHitWire[] };
  "skill-table": { items: SkillRow[]; nextCursor: string | null };
  "skill-card": { skill: SkillCardWire };
  /** Mutation proposal waiting for the user (see `extractPendingApprovals`). */
  "approval-card": { approval: ApprovalRequired };
  /** Tool error (`isError`): AppError code + message. */
  error: { code: string; message: string };
  /** Fallback: raw JSON of the result. */
  json: { value: unknown };
};

export type UiComponent = keyof ToolUiProps;

export const UI_COMPONENTS: readonly UiComponent[] = [
  "venue-table",
  "venue-card",
  "room-table",
  "room-card",
  "search-results",
  "skill-table",
  "skill-card",
  "approval-card",
  "error",
  "json",
];

/** Discriminated union: `switch (ui.component)` narrows `ui.props`. */
export type ToolUi = { [K in UiComponent]: { component: K; props: ToolUiProps[K] } }[UiComponent];

/** One registry entry: validates a tool's structured result and builds the component props. */
export type ToolUiEntry = {
  component: UiComponent;
  /** `null` when the value does not match (→ `json` fallback). */
  resolve: (input: { value: unknown }) => ToolUi | null;
};

import type { ApprovalRequired } from "../approval/approval-schema";
import type {
  EntityTypeWire,
  FieldDefinitionWire,
  InvitationWire,
  ItemWire,
  MemberWire,
  RoleWire,
  SearchHitWire,
  SetupWire,
  SkillCardWire,
  SkillRow,
  VenueWire,
  VocabularyWire,
} from "./wire-schemas";

/**
 * Generative-UI contract: component key → props. The web maps each key to an `@okazi/ui`
 * component; this package only decides which key and validated props a tool result gets.
 */
export type ToolUiProps = {
  "venue-table": { items: VenueWire[]; nextCursor: string | null };
  "venue-card": { venue: VenueWire };
  "item-table": { items: ItemWire[]; nextCursor: string | null };
  "item-card": { item: ItemWire };
  "entity-type-table": { items: EntityTypeWire[]; nextCursor: string | null };
  "entity-type-card": { entityType: EntityTypeWire };
  "field-definition-table": { items: FieldDefinitionWire[]; nextCursor: string | null };
  "field-definition-card": { field: FieldDefinitionWire };
  "vocabulary-table": { items: VocabularyWire[]; nextCursor: string | null };
  "vocabulary-card": { vocabulary: VocabularyWire };
  "setup-table": { items: SetupWire[]; nextCursor: string | null };
  "setup-card": { setup: SetupWire };
  "role-table": { items: RoleWire[]; nextCursor: string | null };
  "role-card": { role: RoleWire };
  "member-table": { items: MemberWire[]; nextCursor: string | null };
  "member-card": { member: MemberWire };
  "invitation-table": { items: InvitationWire[]; nextCursor: string | null };
  "invitation-card": { invitation: InvitationWire };
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
  "item-table",
  "item-card",
  "entity-type-table",
  "entity-type-card",
  "field-definition-table",
  "field-definition-card",
  "vocabulary-table",
  "vocabulary-card",
  "setup-table",
  "setup-card",
  "role-table",
  "role-card",
  "member-table",
  "member-card",
  "invitation-table",
  "invitation-card",
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

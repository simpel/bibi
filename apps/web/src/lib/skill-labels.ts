export type SkillScopeValue = "SYSTEM" | "ORGANIZATION" | "PERSONAL";
export type SkillStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

const SCOPE_KEYS = {
  SYSTEM: "system",
  ORGANIZATION: "organization",
  PERSONAL: "personal",
} as const;
const STATUS_KEYS = { DRAFT: "draft", PUBLISHED: "published", ARCHIVED: "archived" } as const;

/** `skills.scope.*` message key of a skill scope. */
export const scopeKey = ({ scope }: { scope: SkillScopeValue }) => SCOPE_KEYS[scope];

/** `skills.status.*` message key of a skill status. */
export const statusKey = ({ status }: { status: SkillStatusValue }) => STATUS_KEYS[status];

/** Badge variant per lifecycle status. */
export const statusVariant = ({ status }: { status: SkillStatusValue }) =>
  status === "PUBLISHED" ? ("success" as const) : ("secondary" as const);

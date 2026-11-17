import { z } from "zod";
import type { FixedRole } from "./fixed-roles";

/** Roots whose record scope an admin can set per member (ADR 0113). Owned records inherit. */
export const CONFIGURABLE_ROOTS = ["order"] as const;
export type ConfigurableRoot = (typeof CONFIGURABLE_ROOTS)[number];

/** `all`: every record of the root; `related`: only those the member is related to. */
export const RECORD_SCOPES = ["all", "related"] as const;
export type RecordScopeValue = (typeof RECORD_SCOPES)[number];

export type RecordScopes = Readonly<Record<ConfigurableRoot, RecordScopeValue>>;

export const RecordScopeOverrideSchema = z.object({
  root: z.enum(CONFIGURABLE_ROOTS).describe("The root, e.g. order"),
  scope: z
    .enum(RECORD_SCOPES)
    .describe("all: every record; related: only records they are related to"),
});
export type RecordScopeOverride = z.infer<typeof RecordScopeOverrideSchema>;

/** Every root at `all`: SYSTEM, admins, API keys and members without an override. */
export const ALL_RECORDS: RecordScopes = Object.freeze({ order: "all" });

export type SubjectKind = "member" | "apiKey";

export type CanLimitInput = { subjectKind: SubjectKind; preset: FixedRole | null };

/**
 * Whether a subject's records may be limited (ADR 0113): never an admin, who could lift it
 * themselves, and never an API key, which acts for the whole organization.
 */
export const canLimitRecords = ({ subjectKind, preset }: CanLimitInput): boolean =>
  subjectKind === "member" && preset !== "admin";

export type EffectiveScopesInput = CanLimitInput & {
  overrides: readonly { root: string; scope: string }[];
};

/** The subject's scope per root: `all`, unless a valid override limits it. Stale rows are ignored. */
export function effectiveScopes({
  subjectKind,
  preset,
  overrides,
}: EffectiveScopesInput): RecordScopes {
  if (!canLimitRecords({ subjectKind, preset })) return ALL_RECORDS;
  const scopes: Record<ConfigurableRoot, RecordScopeValue> = { ...ALL_RECORDS };
  for (const override of overrides) {
    const parsed = RecordScopeOverrideSchema.safeParse(override);
    if (parsed.success) scopes[parsed.data.root] = parsed.data.scope;
  }
  return Object.freeze(scopes);
}

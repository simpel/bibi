import type { FixedRole } from "./fixed-roles";
import { applyOverrides } from "./overrides";
import type { PermissionSet } from "./permission-set";
import { effectiveScopes, type RecordScopes, type SubjectKind } from "./record-scope";

/** What a member or API key may do and which records they see (ADR 0050, 0113). */
export type SubjectAccess = {
  preset: FixedRole | null;
  permissions: PermissionSet;
  scopes: RecordScopes;
};

type OverrideWhere = {
  organizationId: string;
  subjectType: "MEMBER" | "API_KEY";
  subjectId: { in: string[] };
  status: "ACTIVE";
};

type Rows<Row> = { findMany: (args: { where: OverrideWhere }) => Promise<Row[]> };

/** The two queries it runs; both the base client (auth) and the scoped one (core) fit. */
type OverrideDb = {
  permissionOverride: Rows<{ subjectId: string; feature: string; action: string; effect: string }>;
  recordScopeOverride: Rows<{ subjectId: string; root: string; scope: string }>;
};

const SUBJECT_TYPE = { member: "MEMBER", apiKey: "API_KEY" } as const;

export type ResolveSubjectsInput = {
  /** Any client: auth passes the unscoped one, operations their scoped `context.db`. */
  db: OverrideDb;
  organizationId: string;
  subjectKind: SubjectKind;
  subjects: readonly { id: string; preset: FixedRole | null }[];
};

const toEffect = ({ effect }: { effect: string }) => (effect === "ALLOW" ? "allow" : "deny");

/**
 * Each subject's effective access, by subject id: preset plus allow minus deny (ADR 0050) and its
 * record scopes (ADR 0113). The one resolution `packages/auth` and core both use, read live.
 */
export async function resolveSubjectsAccess({
  db,
  organizationId,
  subjectKind,
  subjects,
}: ResolveSubjectsInput): Promise<Map<string, SubjectAccess>> {
  const where = {
    organizationId,
    subjectType: SUBJECT_TYPE[subjectKind],
    subjectId: { in: subjects.map((subject) => subject.id) },
    status: "ACTIVE" as const,
  };
  const [permissionRows, scopeRows] = await Promise.all([
    db.permissionOverride.findMany({ where }),
    db.recordScopeOverride.findMany({ where }),
  ]);
  const access = new Map<string, SubjectAccess>();
  for (const { id, preset } of subjects) {
    const overrides = permissionRows
      .filter((row) => row.subjectId === id)
      .map((row) => ({ feature: row.feature, action: row.action, effect: toEffect(row) }));
    const scopeOverrides = scopeRows
      .filter((row) => row.subjectId === id)
      .map((row) => ({ root: row.root, scope: row.scope === "RELATED" ? "related" : "all" }));
    access.set(id, {
      preset,
      permissions: applyOverrides({ preset, overrides }),
      scopes: effectiveScopes({ subjectKind, preset, overrides: scopeOverrides }),
    });
  }
  return access;
}

export type ResolveSubjectInput = Omit<ResolveSubjectsInput, "subjects"> & {
  subjectId: string;
  preset: FixedRole | null;
};

/** One subject's effective access (`resolveSubjectsAccess` for a single member or key). */
export async function resolveSubjectAccess({
  subjectId,
  preset,
  ...input
}: ResolveSubjectInput): Promise<SubjectAccess> {
  const access = await resolveSubjectsAccess({ ...input, subjects: [{ id: subjectId, preset }] });
  return access.get(subjectId) as SubjectAccess;
}

import { getDb, type PermissionSubject } from "@okazi/db";

export type LoadSubjectOverridesInput = {
  organizationId: string;
  subjectType: PermissionSubject;
  subjectId: string;
};

/**
 * The subject's active permission overrides (ADR 0050), read live on every request like the
 * role, so an admin's change applies at once. `applyOverrides` in core ignores locked ones.
 */
export async function loadSubjectOverrides({
  organizationId,
  subjectType,
  subjectId,
}: LoadSubjectOverridesInput) {
  const rows = await getDb().permissionOverride.findMany({
    where: { organizationId, subjectType, subjectId, status: "ACTIVE" },
    select: { feature: true, action: true, effect: true },
  });
  return rows.map((row) => ({ ...row, effect: row.effect === "ALLOW" ? "allow" : "deny" }));
}

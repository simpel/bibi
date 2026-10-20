import type { OperationContext } from "../../operations/types";
import type { FixedRole } from "../../permissions/fixed-roles";
import { applyOverrides, type PermissionOverride } from "../../permissions/overrides";
import { notFound } from "../../shared/errors";
import { parseKeyMetadata } from "../api-key/to-api-key-dto";
import { parseMemberRole } from "../member/member-roles";
import type { PermissionProfile, PermissionSubjectInput } from "./schema";

type Context = Pick<OperationContext, "db">;

export const SUBJECT_TYPE = { member: "MEMBER", apiKey: "API_KEY" } as const;

export type LoadPresetInput = { context: Context; subject: PermissionSubjectInput };

/** The subject's preset, or NOT_FOUND when the member or active key is not in this organization. */
export async function loadPreset({ context, subject }: LoadPresetInput) {
  if (subject.subjectType === "member") {
    const row = await context.db.member.findFirst({ where: { id: subject.subjectId } });
    if (!row) return notFound({ entity: "Member" });
    return { ok: true as const, value: parseMemberRole({ role: row.role }) };
  }
  const where = { id: subject.subjectId, enabled: true };
  const key = await context.db.apikey.findFirst({ where, select: { metadata: true } });
  if (!key) return notFound({ entity: "API key" });
  const role = parseKeyMetadata({ metadata: key.metadata })?.role ?? null;
  return { ok: true as const, value: parseMemberRole({ role }) };
}

/** The subject's active overrides, in a stable order. */
export async function loadOverrides({ context, subject }: LoadPresetInput) {
  const rows = await context.db.permissionOverride.findMany({
    where: {
      subjectType: SUBJECT_TYPE[subject.subjectType],
      subjectId: subject.subjectId,
      status: "ACTIVE",
    },
    orderBy: [{ feature: "asc" }, { action: "asc" }],
  });
  return rows.map((row) => ({
    feature: row.feature,
    action: row.action,
    effect: row.effect === "ALLOW" ? "allow" : "deny",
  })) as PermissionOverride[];
}

export type ToProfileInput = {
  subject: PermissionSubjectInput;
  preset: FixedRole | null;
  overrides: PermissionOverride[];
};

export function toProfile({ subject, preset, overrides }: ToProfileInput): PermissionProfile {
  const effective = applyOverrides({ preset, overrides });
  return { ...subject, preset, overrides, effective };
}

import type { OperationContext } from "../../operations/types";
import type { FixedRole } from "../../permissions/fixed-roles";
import { isValidOverride, type PermissionOverride } from "../../permissions/overrides";
import { presetPermissions } from "../../permissions/presets";
import { invalid } from "../../shared/errors";
import { SUBJECT_TYPE } from "./load-subject";
import type { PermissionSubjectInput } from "./schema";

export type CheckOverridesInput = { overrides: readonly PermissionOverride[] };

/** Every override must be a real, unlocked `feature:action`, at most once (ADR 0050). */
export function checkOverrides({ overrides }: CheckOverridesInput) {
  const issues = overrides.flatMap((override, index) => {
    if (!isValidOverride(override)) {
      const message = `${override.feature}:${override.action} cannot be overridden`;
      return [{ path: `overrides.${index}`, message }];
    }
    const first = overrides.findIndex(
      (other) => other.feature === override.feature && other.action === override.action,
    );
    return first === index ? [] : [{ path: `overrides.${index}`, message: "Listed twice" }];
  });
  if (issues.length === 0) return { ok: true as const, value: true as const };
  return invalid({ message: "Some permissions cannot be overridden", issues });
}

export type RelevantInput = { preset: FixedRole | null; overrides: readonly PermissionOverride[] };

/** Drops overrides that change nothing (allowing what the preset has, denying what it lacks). */
export function relevantOverrides({ preset, overrides }: RelevantInput): PermissionOverride[] {
  const base = presetPermissions({ preset });
  return overrides.filter(({ feature, action, effect }) => {
    const inPreset = base[feature]?.includes(action) ?? false;
    return effect === "allow" ? !inPreset : inPreset;
  });
}

export type SaveOverridesInput = {
  context: OperationContext;
  subject: PermissionSubjectInput;
  overrides: readonly PermissionOverride[];
};

/** Replaces the subject's overrides: kept rows are upserted, the rest archived (no deletes). */
export async function saveOverrides({ context, subject, overrides }: SaveOverridesInput) {
  const subjectType = SUBJECT_TYPE[subject.subjectType];
  const { subjectId } = subject;
  await context.db.permissionOverride.updateMany({
    where: { subjectType, subjectId, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });
  for (const { feature, action, effect } of overrides) {
    const data = { effect: effect === "allow" ? "ALLOW" : "DENY", status: "ACTIVE" } as const;
    const key = { organizationId: context.organizationId, subjectType, subjectId, feature, action };
    await context.db.permissionOverride.upsert({
      where: { organizationId_subjectType_subjectId_feature_action: key },
      create: { ...key, ...data },
      update: data,
    });
  }
}

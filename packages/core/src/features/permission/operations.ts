import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { loadOverrides, loadPreset, toProfile } from "./load-subject";
import { checkOverrides, relevantOverrides, saveOverrides } from "./save-overrides";
import {
  PermissionProfileSchema,
  PermissionSubjectInputSchema,
  PermissionUpdateInputSchema,
} from "./schema";

export const getPermissions = defineOperation({
  name: "permission.get",
  kind: "query",
  description:
    "A member's or API key's permissions: its preset (member, manager or admin), the overrides " +
    "an admin set (allow or deny per feature:action) and the effective result. Admins only.",
  input: PermissionSubjectInputSchema,
  output: PermissionProfileSchema,
  permission: "member:edit",
  handler: async ({ input, context }) => {
    const preset = await loadPreset({ context, subject: input });
    if (!preset.ok) return preset;
    const overrides = await loadOverrides({ context, subject: input });
    return ok({ value: toProfile({ subject: input, preset: preset.value, overrides }) });
  },
});

export const updatePermissions = defineOperation({
  name: "permission.update",
  kind: "command",
  description:
    "Fine-tune a member's or API key's permissions on top of its preset: the complete list of " +
    "overrides, each allow or deny for one feature:action (e.g. item:edit). Anything left out " +
    "goes back to the preset. Managing members, API keys and the payment account stays with " +
    "the admin preset and cannot be overridden. Admins only.",
  input: PermissionUpdateInputSchema,
  output: PermissionProfileSchema,
  permission: "member:edit",
  entityType: "permission",
  handler: async ({ input, context }) => {
    const { overrides: requested, ...subject } = input;
    const checked = checkOverrides({ overrides: requested });
    if (!checked.ok) return checked;
    const preset = await loadPreset({ context, subject });
    if (!preset.ok) return preset;
    const before = toProfile({
      subject,
      preset: preset.value,
      overrides: await loadOverrides({ context, subject }),
    });
    const overrides = relevantOverrides({ preset: preset.value, overrides: requested });
    await saveOverrides({ context, subject, overrides });
    const after = toProfile({ subject, preset: preset.value, overrides });
    context.recordChange({ entityId: subject.subjectId, before, after });
    return ok({ value: after });
  },
});

export const permissionOperations = [getPermissions, updatePermissions];

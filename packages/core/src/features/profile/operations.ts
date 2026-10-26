import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid } from "../../shared/errors";
import { requireUser } from "../../shared/require-user";
import { prefillMemberContact } from "../member-profile/prefill-contact";
import { loadProfile } from "./load-profile";
import { ProfileGetInputSchema, ProfileSchema, ProfileUpdateInputSchema } from "./schema";
import {
  WorkingHoursGetInputSchema,
  WorkingHoursSchema,
  WorkingHoursSetInputSchema,
} from "./working-hours-schema";
import { loadWorkingHours, replaceWorkingHours } from "./working-hours-store";

export const getProfile = defineOperation({
  name: "profile.get",
  kind: "query",
  description:
    "Read the caller's own profile (first name, last name, phone, avatar key), shared across " +
    "organizations. `complete` is true once names, phone and working hours are set.",
  input: ProfileGetInputSchema,
  output: ProfileSchema,
  permission: "self:read",
  handler: async ({ context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    return ok({ value: await loadProfile({ context, userId: user.value }) });
  },
});

export const updateProfile = defineOperation({
  name: "profile.update",
  kind: "command",
  description:
    "Save the caller's own first name, last name and phone, and optionally the avatar (a key " +
    "from file.upload; null removes it). The display name follows from first and last name.",
  input: ProfileUpdateInputSchema,
  output: ProfileSchema,
  permission: "self:write",
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const userId = user.value;
    const { avatarKey, ...names } = input;
    // Key ownership (ADR 0063): only the caller's own uploads can become their avatar.
    if (avatarKey && !avatarKey.startsWith(`${userId}/`)) {
      const issues = [{ path: "avatarKey", message: "Upload the avatar with file.upload first" }];
      return invalid({ message: "Unknown avatar", issues });
    }
    const before = await loadProfile({ context, userId });
    const avatar = avatarKey === undefined ? {} : { avatarKey };
    await context.db.userProfile.upsert({
      where: { userId },
      create: { userId, ...names, avatarKey: avatarKey ?? null },
      update: { ...names, ...avatar },
    });
    // The welcome flow saves the profile after joining: give this organization its prefill too.
    await prefillMemberContact({ db: context.db, userId });
    const after = await loadProfile({ context, userId });
    const entityId = after.id ?? userId;
    context.recordChange({ entityId, before: before.id ? before : undefined, after });
    return ok({ value: after });
  },
});

export const getWorkingHours = defineOperation({
  name: "workingHours.get",
  kind: "query",
  description:
    "Read the caller's own working hours in this organization (#449): one entry per working " +
    "weekday (0 = Monday) with start, end and optional break in minutes after midnight. A " +
    "missing weekday is a day off. Each organization keeps its own.",
  input: WorkingHoursGetInputSchema,
  output: WorkingHoursSchema,
  permission: "self:read",
  handler: async ({ context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    return ok({ value: await loadWorkingHours({ context, userId: user.value }) });
  },
});

export const setWorkingHours = defineOperation({
  name: "workingHours.set",
  kind: "command",
  description:
    "Replace the caller's own working hours in this organization with `days` (each weekday at " +
    "most once; start before end; a break needs both ends and lies inside the day). Minutes " +
    "after midnight in the organization's zone. Dated exceptions are kept.",
  input: WorkingHoursSetInputSchema,
  output: WorkingHoursSchema,
  permission: "self:write",
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const before = await loadWorkingHours({ context, userId: user.value });
    const after = await replaceWorkingHours({ context, userId: user.value, days: input.days });
    context.recordChange({ entityId: user.value, before, after });
    return ok({ value: after });
  },
});

/** The caller's own profile (ADR 0061, user-scoped) and working hours here (#449). */
export const profileOperations = [getProfile, updateProfile, getWorkingHours, setWorkingHours];

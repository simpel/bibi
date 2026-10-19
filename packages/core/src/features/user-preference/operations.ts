import { Prisma } from "@okazi/db";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import {
  type JsonValue,
  UserPreferenceListInputSchema,
  UserPreferenceListOutputSchema,
  UserPreferenceSchema,
  UserPreferenceSetInputSchema,
} from "./schema";
import {
  UserSettingsGetInputSchema,
  UserSettingsSchema,
  UserSettingsUpdateInputSchema,
} from "./settings-schema";

const SELECT = { id: true, key: true, value: true, updatedAt: true } as const;

type Row = { id: string; key: string; value: Prisma.JsonValue; updatedAt: Date };

/** Prisma's and Zod's JSON types differ only nominally; the column only ever holds JSON. */
const toDto = ({ value, ...row }: Row) => ({ ...row, value: value as JsonValue });

/** Preferences and settings belong to a user; the system actor has none (ADR 0039, 0046). */
const requireUser = ({ context }: { context: Pick<OperationContext, "actor"> }) =>
  context.actor.userId
    ? ok({ value: context.actor.userId })
    : err({ error: new AppError({ code: "FORBIDDEN", message: "Preferences need a user" }) });

/** Prisma stores a JSON `null` as `JsonNull`; every other value as is. */
const toStored = ({ value }: { value: JsonValue }) =>
  value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

export const listUserPreferences = defineOperation({
  name: "userPreference.list",
  kind: "query",
  description:
    "List the caller's own UI preferences (e.g. saved table column order), optionally only " +
    "keys starting with `prefix`. Never returns anyone else's.",
  input: UserPreferenceListInputSchema,
  output: UserPreferenceListOutputSchema,
  permission: "self:view",
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const items = await context.db.userPreference.findMany({
      where: { userId: user.value, ...(input.prefix ? { key: { startsWith: input.prefix } } : {}) },
      orderBy: { key: "asc" },
      select: SELECT,
    });
    // `startsWith` becomes LIKE, where `_` is a wildcard: keep exact prefix matches only.
    const own = items.filter(({ key }) => key.startsWith(input.prefix ?? ""));
    return ok({ value: { items: own.map(toDto) } });
  },
});

export const setUserPreference = defineOperation({
  name: "userPreference.set",
  kind: "command",
  description:
    "Save one of the caller's own UI preferences under `key` (replaces the previous value). " +
    "Keys look like table.columns.<tableId>; the value is any JSON up to 10 KB.",
  input: UserPreferenceSetInputSchema,
  output: UserPreferenceSchema,
  permission: "self:edit",
  handler: async ({ input: { key, value }, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const userId = user.value;
    const where = { userId_key: { userId, key } };
    const before = await context.db.userPreference.findUnique({ where, select: SELECT });
    const stored = toStored({ value });
    const after = await context.db.userPreference.upsert({
      where,
      create: { userId, key, value: stored },
      update: { value: stored },
      select: SELECT,
    });
    context.recordChange({ entityId: after.id, before: before ?? undefined, after });
    return ok({ value: toDto(after) });
  },
});

const SETTINGS_SELECT = { id: true, onboardingStatus: true, updatedAt: true } as const;

export const getUserSettings = defineOperation({
  name: "userSettings.get",
  kind: "query",
  description:
    "Read the caller's own settings, e.g. whether the first setup of an organization is " +
    "pending, completed or skipped. `onboardingStatus` is null when it never applied.",
  input: UserSettingsGetInputSchema,
  output: UserSettingsSchema,
  permission: "self:view",
  handler: async ({ context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const row = await context.db.userSettings.findUnique({
      where: { userId: user.value },
      select: SETTINGS_SELECT,
    });
    return ok({ value: row ?? { id: null, onboardingStatus: null, updatedAt: null } });
  },
});

export const updateUserSettings = defineOperation({
  name: "userSettings.update",
  kind: "command",
  description:
    "Change the caller's own settings: set the first setup to PENDING (start or restart it), " +
    "COMPLETED or SKIPPED.",
  input: UserSettingsUpdateInputSchema,
  output: UserSettingsSchema,
  permission: "self:edit",
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const userId = user.value;
    const before = await context.db.userSettings.findUnique({
      where: { userId },
      select: SETTINGS_SELECT,
    });
    const after = await context.db.userSettings.upsert({
      where: { userId },
      create: { userId, onboardingStatus: input.onboardingStatus },
      update: { onboardingStatus: input.onboardingStatus },
      select: SETTINGS_SELECT,
    });
    context.recordChange({ entityId: after.id, before: before ?? undefined, after });
    return ok({ value: after });
  },
});

/** The caller's own data: preferences (ADR 0039) and settings (ADR 0046). */
export const userPreferenceOperations = [
  listUserPreferences,
  setUserPreference,
  getUserSettings,
  updateUserSettings,
];

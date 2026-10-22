import { Prisma } from "@bibi/db";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { requireUser } from "../../shared/require-user";
import {
  type JsonValue,
  UserPreferenceListInputSchema,
  UserPreferenceListOutputSchema,
  UserPreferenceSchema,
  UserPreferenceSetInputSchema,
} from "./schema";

const SELECT = { id: true, key: true, value: true, updatedAt: true } as const;

type Row = { id: string; key: string; value: Prisma.JsonValue; updatedAt: Date };

/** Prisma's and Zod's JSON types differ only nominally; the column only ever holds JSON. */
const toDto = ({ value, ...row }: Row) => ({ ...row, value: value as JsonValue });

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
  permission: "self:read",
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
  permission: "self:write",
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

/** The caller's own UI preferences (ADR 0039). */
export const userPreferenceOperations = [listUserPreferences, setUserPreference];

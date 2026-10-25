import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { requireUser } from "../../shared/require-user";
import {
  type UserSettingsDto,
  UserSettingsGetInputSchema,
  UserSettingsSchema,
  UserSettingsUpdateInputSchema,
} from "./schema";

const SELECT = {
  ...{ id: true, dateFormat: true, clockFormat: true },
  ...{ numberFormat: true, currencyDisplay: true, updatedAt: true },
} as const;

const EMPTY: UserSettingsDto = {
  ...{ id: null, dateFormat: null, clockFormat: null },
  ...{ numberFormat: null, currencyDisplay: null, updatedAt: null },
};

type LoadInput = { context: Pick<OperationContext, "db">; userId: string };

/** The caller's row, or the defaults (all null) when they never saved one. */
const loadSettings = async ({ context, userId }: LoadInput): Promise<UserSettingsDto> =>
  (await context.db.userSettings.findUnique({ where: { userId }, select: SELECT })) ?? EMPTY;

export const getUserSettings = defineOperation({
  name: "userSettings.get",
  kind: "query",
  description:
    "Read the caller's own settings, shared across organizations: the date format and clock " +
    "(12 or 24 hour) of every date and time, and the number format and currency display of " +
    "every number and amount. null means the default.",
  input: UserSettingsGetInputSchema,
  output: UserSettingsSchema,
  permission: "self:read",
  handler: async ({ context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    return ok({ value: await loadSettings({ context, userId: user.value }) });
  },
});

export const updateUserSettings = defineOperation({
  name: "userSettings.update",
  kind: "command",
  description:
    "Change the caller's own date format, clock (12 or 24 hour), number format and/or currency " +
    "display. Omitted fields are kept, null resets one to the default (27 Aug 2026, 24 hour, " +
    "the UI language's number style, currency symbol).",
  input: UserSettingsUpdateInputSchema,
  output: UserSettingsSchema,
  permission: "self:write",
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const userId = user.value;
    const before = await loadSettings({ context, userId });
    const after = await context.db.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        dateFormat: input.dateFormat ?? null,
        clockFormat: input.clockFormat ?? null,
        numberFormat: input.numberFormat ?? null,
        currencyDisplay: input.currencyDisplay ?? null,
      },
      update: input,
      select: SELECT,
    });
    context.recordChange({ entityId: after.id, before: before.id ? before : undefined, after });
    return ok({ value: after });
  },
});

/** The caller's own typed settings (ADR 0046). */
export const userSettingsOperations = [getUserSettings, updateUserSettings];

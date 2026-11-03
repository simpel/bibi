import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { requireUser } from "../../shared/require-user";
import { NOTIFICATION_KINDS } from "../notification/schema";
import {
  NotificationPreferenceListInputSchema,
  NotificationPreferenceListOutputSchema,
  NotificationPreferenceSchema,
  NotificationPreferenceSetInputSchema,
} from "./schema";

const SELECT = { kind: true, enabled: true, updatedAt: true } as const;

export const listNotificationPreferences = defineOperation({
  name: "notificationPreference.list",
  kind: "query",
  description:
    "Which kinds of notification the caller gets in this organization (ADR 0094): one entry " +
    "per kind, on unless they turned it off.",
  input: NotificationPreferenceListInputSchema,
  output: NotificationPreferenceListOutputSchema,
  permission: "self:read",
  handler: async ({ context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const rows = await context.db.notificationPreference.findMany({
      where: { userId: user.value },
      select: SELECT,
    });
    const items = NOTIFICATION_KINDS.map(
      (kind) => rows.find((row) => row.kind === kind) ?? { kind, enabled: true, updatedAt: null },
    );
    return ok({ value: { items } });
  },
});

export const setNotificationPreference = defineOperation({
  name: "notificationPreference.set",
  kind: "command",
  description:
    "Turn one kind of notification off (enabled false) or back on for the caller in this " +
    "organization (ADR 0094). Notifications already made are kept.",
  input: NotificationPreferenceSetInputSchema,
  output: NotificationPreferenceSchema,
  permission: "self:write",
  handler: async ({ input: { kind, enabled }, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const where = {
      organizationId_userId_kind: {
        organizationId: context.organizationId,
        userId: user.value,
        kind,
      },
    };
    const before = await context.db.notificationPreference.findUnique({ where, select: SELECT });
    const after = await context.db.notificationPreference.upsert({
      where,
      create: { organizationId: context.organizationId, userId: user.value, kind, enabled },
      update: { enabled },
      select: { id: true, ...SELECT },
    });
    const { id, ...value } = after;
    context.recordChange({ entityId: id, before: before ?? undefined, after: value });
    return ok({ value });
  },
});

/** The caller's choice of notifications (ADR 0094). */
export const notificationPreferenceOperations = [
  listNotificationPreferences,
  setNotificationPreference,
];

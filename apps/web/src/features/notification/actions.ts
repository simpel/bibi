"use server";

import {
  markAllNotificationsRead,
  markNotificationsRead,
  markNotificationsUnread,
  type NotificationKind,
  type NotificationPreferenceDto,
  setNotificationPreference,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type NotificationIdsActionInput = { ids: string[] };
type MarkResult = ActionResult<{ updated: number; unread: number }>;

export async function markNotificationsReadAction({
  ids,
}: NotificationIdsActionInput): Promise<MarkResult> {
  const result = await runOperation({ operation: markNotificationsRead, input: { ids } });
  return toActionResult({ result });
}

export async function markNotificationsUnreadAction({
  ids,
}: NotificationIdsActionInput): Promise<MarkResult> {
  const result = await runOperation({ operation: markNotificationsUnread, input: { ids } });
  return toActionResult({ result });
}

export async function markAllNotificationsReadAction(): Promise<MarkResult> {
  const result = await runOperation({ operation: markAllNotificationsRead, input: {} });
  return toActionResult({ result });
}

export type NotificationPreferenceActionInput = { kind: NotificationKind; enabled: boolean };

export async function setNotificationPreferenceAction({
  kind,
  enabled,
}: NotificationPreferenceActionInput): Promise<ActionResult<NotificationPreferenceDto>> {
  const input = { kind, enabled };
  const result = await runOperation({ operation: setNotificationPreference, input });
  return toActionResult({ result });
}

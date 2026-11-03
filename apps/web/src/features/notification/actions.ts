"use server";

import {
  deleteNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  markNotificationsUnread,
  type NotificationDto,
  type NotificationKind,
  type NotificationPreferenceDto,
  setNotificationPreference,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { notificationListInput } from "./lib/list-input";
import type { NotificationListParams } from "./lib/list-params";

/** How many of the latest notifications the bell's popover shows. */
const LATEST = 8;

/** The bell's popover rows, read when it opens instead of on every page (ADR 0094). */
export async function loadLatestNotificationsAction(): Promise<ActionResult<NotificationDto[]>> {
  const result = await runOperation({ operation: listNotifications, input: { limit: LATEST } });
  return result.ok ? { ok: true, value: result.value.items } : toActionResult({ result });
}

type ListResult = ActionResult<{ items: NotificationDto[]; total: number }>;

/** `/notifications`' current page again, when the list has changed elsewhere. */
export async function listNotificationsAction({
  params,
}: {
  params: NotificationListParams;
}): Promise<ListResult> {
  const input = notificationListInput({ params });
  const result = await runOperation({ operation: listNotifications, input });
  if (!result.ok) return toActionResult({ result });
  const { items, total } = result.value;
  return { ok: true, value: { items, total: total ?? 0 } };
}

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

export async function deleteNotificationsAction({
  ids,
}: NotificationIdsActionInput): Promise<ActionResult<{ deleted: number; unread: number }>> {
  const result = await runOperation({ operation: deleteNotifications, input: { ids } });
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

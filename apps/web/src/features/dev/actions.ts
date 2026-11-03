"use server";

import {
  getAuth,
  isDevEnvironment,
  listDevUsers,
  resetDevOnboarding,
  resolveExecuteContext,
  switchDevUser,
} from "@bibi/auth";
import type { Result } from "@bibi/core";
import { sendTestInboxMessage } from "@bibi/core/dev-inbox-message";
import { sendTestNotification } from "@bibi/core/dev-notification";
import { seedDemo } from "@bibi/core/seed/demo";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";

export type SwitchDevUserActionInput = { userId: string };

/** Dev user switcher: swaps the session cookie for a seeded user (no-op outside development). */
export async function switchDevUserAction({
  userId,
}: SwitchDevUserActionInput): Promise<ActionResult<null>> {
  const switched = await switchDevUser({ userId, headers: await headers() });
  if (switched) return { ok: true, value: null };
  return { ok: false, error: { code: "FORBIDDEN", message: "Switch failed", issues: [] } };
}

/**
 * Dev switcher: recreates the demo organizations and their users (ADR 0025), then signs in again
 * as the same email, because reseeding gives every user a new id and drops the old session.
 */
export async function reseedDevDatabaseAction(): Promise<ActionResult<null>> {
  if (!isDevEnvironment()) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Dev only", issues: [] } };
  }
  const session = await getAuth().api.getSession({ headers: await headers() });
  const result = await seedDemo();
  if (!result.ok) {
    const { code, message } = result.error;
    return { ok: false, error: { code, message, issues: [] } };
  }
  const users = await listDevUsers();
  const user = users.find((u) => u.email === session?.user.email) ?? users[0];
  if (user) await switchDevUser({ userId: user.id, headers: await headers() });
  return { ok: true, value: null };
}

export type ResetDevOnboardingActionInput = { userId: string };

/** Dev switcher: sends a seeded user through the first setup again (ADR 0046); dev only. */
export async function resetDevOnboardingAction({
  userId,
}: ResetDevOnboardingActionInput): Promise<ActionResult<null>> {
  if (await resetDevOnboarding({ userId })) return { ok: true, value: null };
  return { ok: false, error: { code: "FORBIDDEN", message: "Reset failed", issues: [] } };
}

type DevCaller = { organizationId: string; userId: string };

const FORBIDDEN = {
  ok: false,
  error: { code: "FORBIDDEN", message: "Dev only", issues: [] },
} as const;

/** The signed-in member in development, or null (production, signed out, an API key). */
async function devCaller(): Promise<DevCaller | null> {
  if (!isDevEnvironment()) return null;
  const context = await resolveExecuteContext({ headers: await headers() });
  const userId = context.ok ? context.value.actor.userId : null;
  return context.ok && userId ? { organizationId: context.value.organizationId, userId } : null;
}

/** A core `Result` as an action result. */
const toAction = <T>({ result }: { result: Result<T> }): ActionResult<T> =>
  result.ok
    ? { ok: true, value: result.value }
    : { ok: false, error: { code: result.error.code, message: result.error.message, issues: [] } };

/** Dev menu: a test notification about a random ticket for the signed-in member (ADR 0094). */
export async function sendTestNotificationAction(): Promise<ActionResult<{ kind: string }>> {
  const caller = await devCaller();
  return caller ? toAction({ result: await sendTestNotification(caller) }) : FORBIDDEN;
}

/** Dev menu: a made-up booking request mailed to the organization's inbox (ADR 0085). */
export async function sendTestInboxMessageAction(): Promise<ActionResult<{ id: string }>> {
  const caller = await devCaller();
  return caller ? toAction({ result: await sendTestInboxMessage(caller) }) : FORBIDDEN;
}

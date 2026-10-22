"use server";

import {
  getAuth,
  isDevEnvironment,
  listDevUsers,
  resetDevOnboarding,
  switchDevUser,
} from "@bibi/auth";
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

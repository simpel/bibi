"use server";

import { switchDevUser } from "@okazi/auth";
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

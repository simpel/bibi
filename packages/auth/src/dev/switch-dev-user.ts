import { getLogger } from "@okazi/logger";
import { getAuth } from "../get-auth";
import { isDevEnvironment } from "./dev-users";

export type SwitchDevUserInput = { userId: string; headers: Headers };

/** Replaces the current session cookie with one for `userId` (dev only, seeded users only). */
export async function switchDevUser({ userId, headers }: SwitchDevUserInput): Promise<boolean> {
  if (!isDevEnvironment()) return false;
  try {
    await getAuth().api.devSwitchUser({ body: { userId }, headers });
    return true;
  } catch (error) {
    getLogger().warn({ event: "auth.devSwitchFailed", err: error });
    return false;
  }
}

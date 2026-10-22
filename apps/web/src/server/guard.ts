import "server-only";
import type { Locale } from "@bibi/i18n";
import { redirect } from "@bibi/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { getSessionState, type SessionState } from "./session";

export type GuardInput = { locale: Locale };

/** Protected-route guard: anonymous → /login, no active organization → /select-organization. */
export async function requireReadySession({
  locale,
}: GuardInput): Promise<Extract<SessionState, { status: "ready" }>> {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect({ href: ROUTES.login, locale });
  if (state.status === "needsOrganization") redirect({ href: ROUTES.selectOrganization, locale });
  return state as Extract<SessionState, { status: "ready" }>;
}

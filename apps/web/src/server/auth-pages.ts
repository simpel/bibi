import "server-only";
import { redirect } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { getSessionState, type SessionState } from "./session";

export type AuthPageInput = { locale: string };

/** Login/sign-up pages: signed-in users go on to the app (or to organization selection). */
export async function redirectIfSignedIn({ locale }: AuthPageInput): Promise<void> {
  const state = await getSessionState();
  if (state.status === "ready") redirect({ href: ROUTES.venues, locale });
  if (state.status === "needsOrganization") redirect({ href: ROUTES.selectOrganization, locale });
}

/** Pages that need a session but not an organization (select-organization, consent...). */
export async function requireAnySession({
  locale,
}: AuthPageInput): Promise<Exclude<SessionState, { status: "anonymous" }>> {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect({ href: ROUTES.login, locale });
  return state as Exclude<SessionState, { status: "anonymous" }>;
}

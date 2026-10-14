import "server-only";
import { isPlatformAdmin } from "@okazi/auth";
import type { Locale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { notFound } from "next/navigation";
import { ROUTES, withNext } from "@/lib/routes";
import { getSessionState } from "./session";

export type RequirePlatformAdminInput = { locale: Locale };

/**
 * Guard for `/admin` (ADR 0015): anonymous → login, anyone but a platform admin → 404 (the area's
 * existence is not revealed). Every operation checks again through `resolvePlatformContext`.
 */
export async function requirePlatformAdmin({ locale }: RequirePlatformAdminInput) {
  const state = await getSessionState();
  if (state.status === "anonymous") {
    redirect({ href: withNext({ path: ROUTES.login, next: ROUTES.admin }), locale });
  }
  const session = (state as Exclude<typeof state, { status: "anonymous" }>).session;
  if (!(await isPlatformAdmin({ userId: session.user.id }))) notFound();
  return session;
}

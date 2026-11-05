import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";
import { ROUTES, withNext } from "@/lib/routes";
import { getSessionState } from "@/server/session";

type AcceptInvitationPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: AcceptInvitationPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "auth", key: "acceptInvitation" });
}

/**
 * Link target of the invitation mail. Leads back to the main welcome view (/welcome),
 * where the user can review the invitation and join via the primary button.
 */
export default async function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const state = await getSessionState();
  if (state.status === "anonymous") {
    const next = `/accept-invitation/${encodeURIComponent(id)}`;
    redirect({ href: withNext({ path: ROUTES.login, next }), locale });
  }
  redirect({ href: `${ROUTES.welcome}?invitation=${encodeURIComponent(id)}`, locale });
}

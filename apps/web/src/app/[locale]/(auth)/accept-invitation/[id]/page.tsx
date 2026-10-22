import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { InvitationCard } from "@/features/auth/ui/invitation-card";
import { redirect } from "@/lib/navigation";
import { ROUTES, withNext } from "@/lib/routes";
import { getSessionState } from "@/server/session";

type AcceptInvitationPageProps = { params: Promise<{ locale: string; id: string }> };

/** Link target of the invitation mail. Anonymous visitors sign in first, then come back. */
export default async function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const state = await getSessionState();
  if (state.status === "anonymous") {
    const next = `/accept-invitation/${encodeURIComponent(id)}`;
    redirect({ href: withNext({ path: ROUTES.login, next }), locale });
  }
  return <InvitationCard invitationId={id} />;
}

import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadJoinable } from "@/features/welcome/load-joinable";
import { WelcomeStart } from "@/features/welcome/ui/start/welcome-start";
import { pageTitle } from "@/lib/page-metadata";
import { requireAnySession } from "@/server/auth-pages";

type WelcomeRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ invitation?: string; code?: string }>;
};

export async function generateMetadata() {
  return pageTitle({ namespace: "welcome", key: "start.title" });
}

/**
 * Pick an organization, accept an invitation or create a new organization. A user whose work
 * domain is claimed or who has an assigned organization is offered that organization first (ADR 0078).
 */
export default async function WelcomeRoute({ params, searchParams }: WelcomeRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const state = await requireAnySession({ locale });
  const { offers, memberships, invitations } = await loadJoinable({ session: state.session });
  const search = await searchParams;
  return (
    <WelcomeStart
      email={state.session.user.email}
      invitations={invitations}
      offers={offers}
      memberships={memberships}
      targetInvitationId={search?.invitation}
      initialCode={search?.code}
    />
  );
}

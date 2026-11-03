import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadJoinable } from "@/features/welcome/load-joinable";
import { loadUserInvitations } from "@/features/welcome/load-user-invitations";
import { JoinOfferStep } from "@/features/welcome/ui/join/join-offer-step";
import { WelcomeStart } from "@/features/welcome/ui/start/welcome-start";
import { requireAnySession } from "@/server/auth-pages";

type WelcomeRouteProps = { params: Promise<{ locale: string }> };

/**
 * Pick an organization, accept an invitation or create a new organization. A user whose work
 * domain is claimed is offered that organization first (ADR 0078).
 */
export default async function WelcomeRoute({ params }: WelcomeRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const state = await requireAnySession({ locale });
  const { offers } = await loadJoinable({ session: state.session });
  const [offer] = offers;
  if (offer) return <JoinOfferStep offer={offer} />;
  const invitations = await loadUserInvitations();
  return <WelcomeStart email={state.session.user.email} invitations={invitations} />;
}

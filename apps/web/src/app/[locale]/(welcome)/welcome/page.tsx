import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { WelcomeStart } from "@/features/welcome/ui/start/welcome-start";
import { requireAnySession } from "@/server/auth-pages";

type WelcomeRouteProps = { params: Promise<{ locale: string }> };

/** Pick an organization, accept an invitation or create a new organization. */
export default async function WelcomeRoute({ params }: WelcomeRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const state = await requireAnySession({ locale });
  return <WelcomeStart email={state.session.user.email} />;
}

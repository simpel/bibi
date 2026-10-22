import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { OnboardingPage } from "@/features/onboarding/ui/onboarding-page";

type OnboardingRouteProps = { params: Promise<{ locale: string }> };

/** The first setup of a new organization: chat on the left, the first version on the right. */
export default async function OnboardingRoute({ params }: OnboardingRouteProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <OnboardingPage />;
}

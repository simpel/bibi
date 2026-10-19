import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { OnboardingShell } from "@/features/onboarding/ui/onboarding-shell";
import { requireReadySession } from "@/server/guard";

type OnboardingLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Full-screen first setup (ADR 0045): same guard as the app, but no sidebar or top bar. */
export default async function OnboardingLayout({ children, params }: OnboardingLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  await requireReadySession({ locale });
  return <OnboardingShell>{children}</OnboardingShell>;
}

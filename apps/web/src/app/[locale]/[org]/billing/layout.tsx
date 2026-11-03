import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { WelcomeShell } from "@/features/welcome/ui/welcome-shell";
import { requireReadySession } from "@/server/guard";

type BillingLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** `/:org/billing/*` (ADR 0095): full screen outside the app shell, which the gate closes. */
export default async function BillingLayout({ children, params }: BillingLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  await requireReadySession({ locale });
  return <WelcomeShell>{children}</WelcomeShell>;
}

import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { WelcomeShell } from "@/features/welcome/ui/welcome-shell";
import { requireReadySession } from "@/server/guard";

type OrgWelcomeLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** `/:org/welcome/*` (ADR 0061): full screen, no app shell; the org layout checked membership. */
export default async function OrgWelcomeLayout({ children, params }: OrgWelcomeLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  await requireReadySession({ locale });
  return <WelcomeShell>{children}</WelcomeShell>;
}
